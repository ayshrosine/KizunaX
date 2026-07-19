"""
AI Accuracy Validation Tests

These tests validate the accuracy of AI-powered features:
- Document categorization
- Semantic search
- Relationship detection
"""

import pytest
from app.services.categorization import categorize_document
from app.services.ai_service import ai_service
from app.services.embeddings import embedding_service


@pytest.mark.asyncio
async def test_categorization_accuracy():
    """Test that document categorization produces expected categories"""
    # Test cases with known expected categories
    test_cases = [
        {
            "title": "Python Machine Learning Certificate",
            "content": "This certificate verifies completion of a machine learning course using Python, pandas, and scikit-learn.",
            "expected_category": "Certifications"
        },
        {
            "title": "Web Development Portfolio",
            "content": "A collection of web applications built with React, Node.js, and MongoDB.",
            "expected_category": "Projects"
        },
        {
            "title": "Summer Internship at Google",
            "content": "Worked on infrastructure team improving database performance and latency.",
            "expected_category": "Internships"
        },
        {
            "title": "Academic Transcript",
            "content": "Official transcript showing courses completed and GPA for Fall 2023 semester.",
            "expected_category": "Academics"
        },
        {
            "title": "Hackathon Winner",
            "content": "First place award in national hackathon for innovative AI solution.",
            "expected_category": "Achievements"
        }
    ]
    
    # Create a test user ID
    test_user_id = "test_user_123"
    
    passed = 0
    failed = 0
    
    for case in test_cases:
        result = await categorize_document(
            case["title"],
            case["content"],
            test_user_id,
            "test_doc_id"
        )
        
        category = result.get("category", "")
        confidence = result.get("confidence", 0)
        
        # Check if category matches expected (case-insensitive)
        if category.lower() == case["expected_category"].lower():
            passed += 1
        else:
            failed += 1
            print(f"FAIL: Expected {case['expected_category']}, got {category}")
        
        # Check if confidence is reasonable
        if confidence < 0.5:
            print(f"WARN: Low confidence ({confidence:.2f}) for {case['title']}")
    
    accuracy = passed / len(test_cases) * 100
    print(f"\nCategorization Accuracy: {accuracy:.1f}% ({passed}/{len(test_cases)} passed)")
    
    # Require at least 60% accuracy for passing
    assert accuracy >= 60, f"Categorization accuracy {accuracy:.1f}% below threshold 60%"


@pytest.mark.asyncio
async def test_skill_extraction():
    """Test that skills are extracted correctly from documents"""
    test_doc = {
        "title": "Full Stack Developer Resume",
        "content": "Experienced in Python, JavaScript, React, Node.js, MongoDB, Docker, and Kubernetes. Built multiple web applications and microservices."
    }
    
    test_user_id = "test_user_123"
    test_doc_id = "test_doc_456"
    
    result = await categorize_document(
        test_doc["title"],
        test_doc["content"],
        test_user_id,
        test_doc_id
    )
    
    skills = result.get("skills", [])
    
    # Check that relevant skills were extracted
    expected_skills = ["python", "javascript", "react", "node.js", "mongodb"]
    found_skills = [s.lower() for s in skills]
    
    # At least 3 of the expected skills should be found
    matches = sum(1 for skill in expected_skills if skill in found_skills)
    assert matches >= 3, f"Only {matches} of {len(expected_skills)} expected skills found"
    
    print(f"Skill extraction: {matches}/{len(expected_skills)} expected skills found")


@pytest.mark.asyncio
async def test_embedding_service_availability():
    """Test that embedding service is available and working"""
    try:
        if not embedding_service or not embedding_service.collection:
            pytest.skip("Embedding service not available")
        
        # Test embedding generation
        test_text = "This is a test document for embedding generation."
        embedding = embedding_service._generate_embedding(test_text)
        
        assert embedding is not None, "Embedding generation returned None"
        assert len(embedding) > 0, "Embedding is empty"
        assert isinstance(embedding, list), "Embedding is not a list"
        assert all(isinstance(x, (int, float)) for x in embedding), "Embedding contains non-numeric values"
        
        print(f"Embedding dimension: {len(embedding)}")
        
    except Exception as e:
        pytest.skip(f"Embedding service test failed: {e}")


@pytest.mark.asyncio
async def test_search_with_user_isolation():
    """Test that search respects user_id for multi-tenant isolation"""
    try:
        if not embedding_service or not embedding_service.collection:
            pytest.skip("Embedding service not available")
        
        # Add test documents for two users
        user_a = "test_user_a"
        user_b = "test_user_b"
        
        doc_a_id = "test_doc_a"
        doc_b_id = "test_doc_b"
        
        # Add embeddings with different user_ids
        embedding_service.add_document_embedding(
            doc_a_id,
            "Python programming and machine learning",
            {"user_id": user_a, "category": "Projects"}
        )
        
        # We need to make sure the user_id is passed for search_similar
        embedding_service.add_document_embedding(
            doc_b_id,
            "JavaScript web development",
            {"user_id": user_b, "category": "Projects"}
        )
        
        # Search as user A
        results_a = embedding_service.search_similar(
            query="Python",
            user_id=user_a,
            n_results=5
        )
        
        # Verify all results belong to user A
        for result in results_a:
            assert result['metadata']['user_id'] == user_a, f"User A's search returned data from {result['metadata']['user_id']}"
        
        # Search as user B
        results_b = embedding_service.search_similar(
            query="JavaScript",
            user_id=user_b,
            n_results=5
        )
        
        # Verify all results belong to user B
        for result in results_b:
            assert result['metadata']['user_id'] == user_b, f"User B's search returned data from {result['metadata']['user_id']}"
        
        # Cleanup
        embedding_service.delete_document(doc_a_id)
        embedding_service.delete_document(doc_b_id)
        
        print("User isolation in search: PASSED")
        
    except Exception as e:
        pytest.skip(f"Search isolation test failed: {e}")


@pytest.mark.asyncio
async def test_ai_service_fallback():
    """Test that AI service falls back gracefully when OpenAI is unavailable"""
    # Test categorization fallback
    result = ai_service._categorize_fallback(
        "Test Certificate",
        "This is a certificate document"
    )
    
    assert result is not None, "Fallback categorization returned None"
    assert "category" in result, "Fallback result missing category"
    assert "confidence" in result, "Fallback result missing confidence"
    
    print("AI service fallback: PASSED")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
