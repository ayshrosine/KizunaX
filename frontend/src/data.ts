/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Document, TimelineMilestone, RecentUpload, GraphNode, GraphLink, CareerPath, ChatMessage } from './types';

export const USER_AVATAR = "https://lh3.googleusercontent.com/aida-public/AB6AXuDqyLUH16VIR7c0PMhjsS5fCEKXS1920AJagU_vi8kE-qLM8jKu8eJ5i2SG3igH-bf6FrlSrg6aBZpf2jiUQWb0QXIdnROqGBBsBMNQgb_HlFSYgnvWYp22A3F9eB-FF4X-UIPHPBsSRko9t9--IsZqaGYraNTZr_RBsaWJ2KMATJAEf06W0g1fhcPZGDqjGTRL-_5wyFlNbQnsHK7AvxpFAusDm7NODQtfoq1iRsj9pPhXJbic_sSbIysnLM3vjheaNhOOAcNP-A";

export const PORTFOLIO_AVATAR = "https://lh3.googleusercontent.com/aida-public/AB6AXuC5SzlykOaxR1pdrDXgyij3RRW9xPX7ZVIBYnvpNJLc2k_Tm99Zkb5_lRBDEE305D2PKkbSX1tkSDVZgFCj8oVExUqOdv5ypnJzwYfBNC3QYdGYymoG1LSfy63zRGRILDOcRYlF9o0u_EJOl1emBFsfLW9PoJbFC6JnZbjnG0Rq3pmfxNSP5cOzIHJkjMbb308SKfDjyJGEGwF9DkytLjVfMHiRrqpkoKgwtLuoWRa1ZH-oR_L_82cURjf68ibRHtED06pJ9FJhgw";

export const IDENTITY_VAULT_LOGO = "https://lh3.googleusercontent.com/aida-public/AB6AXuBJMBkaX2dpR-AKdJ4bo47rmhPgg4bieLEcCA1SgGLt2HFQJL86Pk5jg4fYMDgSy3yp9J0L3m_vFt9kfJeBSqIBG08WDgwr4CJlMcsMhW3JJLUuvjJmY9sh3h1No7JPPGjzIfZaNZvyiQLv6ReK63KAkqk0aINfYje-3m5Ed3hWdv6xPIXfd89DOjYrmOYgZ8GPzcj6Mi0Fx2Ox033M9la5Hkpkvq71PUbK1ODxdApbwzwDZTxdlhOOqEFC3_GMQQAoDLNLnrMXHQ";

export const PORTFOLIO_PROJECT_IMAGE = "https://lh3.googleusercontent.com/aida-public/AB6AXuCzZNmZPT8TJ_-w8YLomHA_NamuYVJtti8yZRYUWCwEpoZ5S5Z7epiQ9pNvDRWbo-FUW8d16y1m0ve5MAlnZ4fm06VAGidG3FgopkYiKmcwxa3slwByF2ZM7LkGJ9aGhvhFxT0v29WHduraSAOipfDZN6me9lsQcVGE2_85P9ZhH-ZFOgR3YVnvpq64kV3uVIyb2UE3J4A2ZiIkO3u-I_jHbMVCxfQDmGfd3d80cpTec8BARblqHojpQGBbuoaetWBJ3JQ90O4w5A";

export const SERVER_HARDWARE_IMAGE = "https://lh3.googleusercontent.com/aida-public/AB6AXuAvUvdm_lw-oucJ4x7vL2LPmU8Xx7kyFj6I2lWGDQB6BYTjH3Anhaf90agfpVokxQI20hFnwZstWVzkCg3ilxQMZlkLND8VyHN7bzVJfq75_FO1wrZkYImW2krEd_ZyIKfZHddsoOYySoFLZuQyWk0if6TlRZcMZM9md7KFkGHE_O_ll0zAkjN72Vr3oCTUuTHworzq4Yhrb52lIs2ui_CUOLBng4bI0rEblA1gAwXe1a8GicJhTQrpYPAGcJZHbcR8jqJxehhTAA";

export const initialDocuments: Document[] = [
  {
    id: "doc-1",
    title: "ML Research Paper",
    date: "Oct 12, 2023",
    category: "Academic",
    size: "2.4 MB",
    iconType: "paper",
    bgImageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDN4VCyw_I7l7bMihJcCTtfvCdMkJ1xMg19U06wJiZzOXXIbDkG8dx3jcwf-Jo_78XIQkv_YvULGBi3ohdF3CSzysYj4YYSuLzhLokgiAJ2GnpR3z9fO6Hm4kTD097gfnObbzsGH5nbVE6m-b6ledaj3dYDlEPpbBQDSznS1MaZhIoKZvBNX_yTq_siiNTaq62MMaW3XR-y2u5KxM3KSSPBsJSK9crmnRs7Y9u_fFTYda8sXSecqfBFr2ku9-bY3Vp-ptRDsq1gkw",
    altText: "A macro close-up of a high-resolution technical research paper with complex mathematical formulas."
  },
  {
    id: "doc-2",
    title: "Coursera UX Cert",
    date: "Sep 28, 2023",
    category: "Professional",
    size: "1.1 MB",
    iconType: "cert",
    bgImageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAaqh09p8RHZ-NiJQmlyWrco40BBty-jrF-pgZPsyT_WBfX9qHSgtf3mcESpNCp4FH1R9RCQGKyOY4bD4eCuKr1hFNIwHDNWVIuhFq46a7UcKQJCPOjwKD-0UzyomhrLlTEAFlfd6YSRuiwxQcSAyLBKUuipjFaknc5Kul50oRKv2dtv_A6wkzAtzEHbu3QOAu-g0s6CS1qO9nD64Arj0Bq_Zd48Jni9etA5bfHdN7GT49Q-ZVmKmweGmLzhX-s5o4Ed0DG5ylK8A",
    altText: "A professional certification document with a sophisticated gold foil seal."
  },
  {
    id: "doc-3",
    title: "Final Portfolio V2",
    date: "Nov 02, 2023",
    category: "Design",
    size: "15.8 MB",
    iconType: "draw",
    bgImageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBwAuGgkPYu5YCyVq4KmhhwvlCNI6ayI8u17RM_xOt2j2kZDeiZoUam20i2dosR08eR2qr2gBzolJeQvhcVwC9t8AkAhnzbT9vQqxy-Bbe4P3zSz7nXUG86GBE3lArZngizzyBJGjy34pSYKF1rwGYOQINkFeGkhrvsa-v7lHTP8j_CKVmUpP_a17VxwNFjmS6BIDYndIN-JiUjNwX-iAs0cspoIs6uzUJf7n4BTFBlaQBDXAdwPU_23NNKSRPWweMV3T8I5GH5ag",
    altText: "A sleek digital portfolio interface shown on a high-end tablet screen."
  },
  {
    id: "doc-4",
    title: "Tax Return 2023",
    date: "Jan 15, 2024",
    category: "Finance",
    size: "0.8 MB",
    iconType: "receipt",
    bgImageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuD4nKqc9NOm2QbidfRky1ymhlZh6YUDfcP8734fv6yR0SdKI79ZmtKNzk3Rg9al4vmm9MY6r9bOYneF9fzs9x_pPQCyH9HI-bzMvwjSVlLF4P4EnvHTX0mOTsPI7Vv0XTJMSgOCozxQ5VpDN3KhFtrp-tV-Cev00_y4rz40b0TGlO2quGuRb78cpJWePYQfOI68gw05AGhikRD74dI7zkIpsXXlSGm-i_LHHaETixBr4rBBH3QZHnY_gPvmBubiE1U-7wN9kWskpw",
    altText: "A stylized digital representation of a secure tax document with a clean grid of financial data."
  },
  {
    id: "doc-5",
    title: "Apartment Lease",
    date: "Feb 10, 2024",
    category: "Legal",
    size: "3.2 MB",
    iconType: "home",
    bgImageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuC75DzxMCggzDZdaFIaOo491xvbf8p-nUTS9kOBUlHxCmMHW4R6YSBCP6IpWmQIW03qijoqD7rtqYKDzhvgDfRyUuZZ7ydFlAPKX0e2Cn9Se7-CJ9qGuroPKttY6Qg4EO3Rd3pTKuBV75uNpLhKrMY-eRdjBYtjrKwnxC66PYJWy_IqAJMTBSt6H6oypODPeM_sRFGn4TMERZZ8yy0gQ17r4a15kzpw0rdD4zOXFepBnszHEKQGvyrLVokIQoc8mCcI89wZabWuIg",
    altText: "A modern lease agreement document on a wooden clipboard."
  },
  {
    id: "doc-6",
    title: "Medical History",
    date: "Mar 05, 2024",
    category: "Health",
    size: "4.5 MB",
    iconType: "medical",
    bgImageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBzLKoAAyK_P3MRHzYiHCgZSBC33oiHqcIGrHDEFO5YiAnw0rPTS6vGcPnDNFVPg2-VckRb1cVrwYYIv3JaE7kinhC69yJBtbaG4hPmWdQDML6qUAnwYjyDuGaQOPrilHDHCRKURnUVr51KOxNhehjaYNXLAW7EHBya1GNGie-qfIguFZTY5vNraaH_wTfGDnajkyJYWcK2USFoYgBCaqxmDQXYNSA0ANOOd5F-G93hGx9FZGiicMGkEIJOwo8IDttEiplOh2-mcg",
    altText: "A set of clean, minimalist medical records with clear diagnostic charts."
  },
  {
    id: "doc-7",
    title: "Travel Documents",
    date: "Apr 12, 2024",
    category: "Personal",
    size: "1.5 MB",
    iconType: "flight",
    bgImageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAHU7ZErfJI6F7PJ2yXpEndGdwb1IVnL96xWwMchwA1XKvBm3QDzpqDLjdc7fBufEqVR7d8hBh8YAk6dt6mjSOACXc7-9OaA25z4_HCwWkNAlwEtyoJtNBOCIFNaZwqpdPk4QQuwPZoCDVGzqSXI_5dOZhMU3O7Q3ODOXYStP--vt3wYhr56z1xc0ZC1QlVZLdNbkzwORGK_cuXvXuIFCav0kNp38yX9KAukSEeqdc_hwND1IAjYcnzJh7fcAmpdwy0Jf6dpgDLiQ",
    altText: "A passport and travel tickets resting on a minimalist marble surface."
  },
  {
    id: "doc-8",
    title: "Identity Backup",
    date: "May 20, 2024",
    category: "System",
    size: "0.2 MB",
    iconType: "security",
    bgImageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCkR_ir59DSwJJbQi-TT2RUm2LncPTIawSpvrzA9E1_QyPvfxTJ5O6BkCGHaYeKDOVgJU-lRfPCN2zWCyRxtBAc6JL9K3Y62ZfTUhMoWo0eKxSuIZlILu_-y69hyQszGo2zZgc-LHiuFg_9KlU6npJU_zL1pEn2_Q2DUw_2i5PF9IqsS425I1jsefj-ggSx7q1-QIbO1dcIq-JFOy2diMREi-Yxhwcls2Cxa8SUADjeV0RjJ_Oad4t5sN_jeWuieH-TrwMmLem4tw",
    altText: "A clean cryptographic hardware key and a digital security certificate interface."
  }
];

export const initialMilestones: TimelineMilestone[] = [
  {
    id: "ms-1",
    title: "Python Certification",
    date: "Jan 2023",
    category: "Certification",
    description: "Verified mastery in core Python logic, data structures, and automation scripts through official assessment.",
    source: "Coursera Verified",
    badgeUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAy9xbmGwto9Mn2K7Dt3ORZReCR0-e0v6BwELK1Luk709lreH5b9n62JAbZvnZmniFbPc8WmVT8YEjDa2TSZjVnSpkZFx0v1Pozy-OuETTCqkF_OtkGXmLFzahYobsWqiHk_a9OOiSEms7M1FHg5FjeTJ1_6b3FeZiQYcEHjZjsb8rIW_wGJUmE1x8TJmH92qrhs-FLKQkvhxowvnTY4Vad7V5hnzfgJRccKsls6-C7vWhSxSDguuHXCWcMWQtRIX41d7E0pAt9Gg",
    borderColor: "border-amber-500",
    colorTheme: "amber"
  },
  {
    id: "ms-2",
    title: "Data Science Club Lead",
    date: "Sept 2024",
    category: "Leadership",
    description: "Spearheaded weekly workshops on exploratory data analysis and mentored 50+ members in collaborative research.",
    source: "University Portal",
    badgeUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuC-qLLlgbHP1xLgfErflWkXxxP84Pfy6cXauuVWTDekerxRmUSL00Q9v7sCm1ouGeiHHeVQZSjjeyOS4PivCbY7LWtBA2Ao9tNiekq7oDVcglxNJm4gWScAHGukKoSVGPv_1po9KLifyXM_AWuF1rNRVmx_egjoeKsNDVPW4vyX9_m1XJIcv8cLOqd1flVy9PYEZ-MXGYRWDEkwNtMYA-hBIvmfV0zJEwC6aeZ4NRzTOVD_6fkKDyS9YTPfsVTMCD0PwU0gHq3UMA",
    borderColor: "border-teal-500",
    colorTheme: "teal"
  },
  {
    id: "ms-3",
    title: "Internship at Google",
    date: "Summer 2024",
    category: "Experience",
    description: "Assisted the Infrastructure Team in optimizing query latency for high-traffic storage systems.",
    source: "Enterprise SSO Verified",
    badgeUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCR2cW0H_8qVQFAT4nXTlaNN-h_svoFMhrdZ6xl4RBQMLqcQIU-_VvmRgBn72Jgkh8vyP72W-4HaRWDUoK_wDAXJrVBfkFV-BW5Ud-Fw7KqGL5s8mN0s2j6i5fGJXBR0U892q0dEj0tsK61A8WsgJROq26jhnhp_ZfegNJPMz7vhmaBbT0phOL8pFn3R_eXSJxGx9ez0kyqdJBVsoJ0NHkI5xWrsinU78cPTNkUDQuP6Bv0K0hEKlslrRzJwq5EhZFOMhSdGZbhCQ",
    borderColor: "border-purple-500",
    colorTheme: "purple"
  },
  {
    id: "ms-4",
    title: "AI/ML Project Portfolio",
    date: "March 2025",
    category: "Portfolio",
    description: "Comprehensive collection of neural network architectures and dataset cleaning pipelines for predictive modeling.",
    source: "GitHub Integration",
    badgeUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDmbgL4ET3atAJfsh45XukausFAlWsMMBgYQEkHqbs8S2PYiSjsUGh8g2D5xZfxfPFnpa-CrqrpEPmhS8DjiwX-UTTkvycOXr-xFr1iUFBE2-I9dCjJNbJ6xzfq6vw4jz0MdON2PypT0NrRlXmzaIiJkwvarM9yVrESGkOsvFGZ74KgUWTou5wZa3MQOr--mWo_9RUhfxs4ilPC-HBVMZfq2qfjBWNH3ep17RffoJfLPUlcSHYQt1UK6dlxFXw5AEgzXuxcw5kxdA",
    borderColor: "border-blue-500",
    colorTheme: "blue"
  }
];

export const initialRecentUploads: RecentUpload[] = [
  { id: "ru-1", title: "AWS Certified Cloud Practitioner", date: "Modified 2 days ago", category: "Cert", type: "cert" },
  { id: "ru-2", title: "E-commerce React Project", date: "Modified 4 days ago", category: "Project", type: "project" },
  { id: "ru-3", title: "Resume_2024", date: "Modified 1 week ago", category: "Academics", type: "academics" },
  { id: "ru-4", title: "Goldman Sachs Internship Letter", date: "Modified 2 weeks ago", category: "Internship", type: "internship" },
  { id: "ru-5", title: "Python for Data Science", date: "Modified 1 month ago", category: "Skill", type: "skill" }
];

export const initialGraphNodes: GraphNode[] = [
  { id: "python", label: "Python", category: "skills", iconType: "terminal", colorClass: "text-tertiary", bgClass: "bg-tertiary-fixed-dim" },
  { id: "cloud-arch", label: "Cloud Architecture", category: "skills", iconType: "analytics", colorClass: "text-primary", bgClass: "bg-primary-fixed" },
  { id: "ux-cert", label: "UX Certificate", category: "certifications", iconType: "verified", colorClass: "text-orange-800", bgClass: "bg-orange-200" },
  { id: "final-portfolio", label: "Final Portfolio v2", category: "projects", iconType: "architecture", colorClass: "text-secondary", bgClass: "bg-secondary-container" },
  { id: "google-internship", label: "Google Internship", category: "internships", iconType: "business_center", colorClass: "text-purple-950", bgClass: "bg-purple-200" }
];

export const initialGraphLinks: GraphLink[] = [
  { source: "python", target: "cloud-arch" },
  { source: "python", target: "final-portfolio" },
  { source: "cloud-arch", target: "google-internship" },
  { source: "ux-cert", target: "final-portfolio" }
];

export const initialCareerPaths: CareerPath[] = [
  {
    id: "path-1",
    title: "Senior Solutions Architect",
    match: 92,
    description: "Based on your deep expertise in Cloud Systems and Distributed Databases.",
    iconType: "architecture",
    technicalSkills: 100,
    leadershipExperience: 84
  },
  {
    id: "path-2",
    title: "Lead Data Engineer",
    match: 76,
    description: "Strong foundation in ETL pipelines, requires more Scala/Java evidence.",
    iconType: "database",
    technicalSkills: 90,
    leadershipExperience: 62
  },
  {
    id: "path-3",
    title: "Product Manager (Tech)",
    match: 58,
    description: "Developing path; requires verified business case and strategy artifacts.",
    iconType: "diversity",
    technicalSkills: 50,
    leadershipExperience: 66
  }
];

export const defaultChatHistory: ChatMessage[] = [
  {
    id: "chat-msg-1",
    sender: "user",
    text: "Show me my lease agreement from last year and highlight the renewal clause."
  },
  {
    id: "chat-msg-2",
    sender: "assistant",
    text: "I found your 2023 Residential Lease Agreement. According to **Section 14.2 (Renewal)**, you are required to provide a written notice at least 60 days before the expiration date (Dec 31st).",
    documents: [
      { title: "Lease_Agreement_2023.pdf", size: "2.4 MB", date: "Oct 12, 2023", iconType: "pdf" },
      { title: "Renewal_Appendix_A.docx", size: "128 KB", date: "Nov 02, 2023", iconType: "doc" }
    ]
  }
];
