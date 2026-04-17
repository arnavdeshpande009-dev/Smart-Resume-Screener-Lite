import re

# 🔥 ROLE-BASED SKILLS (core + optional)
ROLE_SKILLS = {
    "data_analyst": {
        "core": ["sql", "excel", "pandas", "data analysis"],
        "optional": ["numpy", "power bi", "tableau", "statistics"]
    },
    "ml_engineer": {
        "core": ["machine learning", "python", "scikit-learn"],
        "optional": ["tensorflow", "pytorch", "nlp", "deep learning"]
    },
    "frontend": {
        "core": ["javascript", "react", "html", "css"],
        "optional": ["next.js", "tailwind", "redux"]
    },
    "backend": {
        "core": ["python", "api", "database"],
        "optional": ["fastapi", "django", "node", "mongodb"]
    },
    "project_manager": {
        "core": ["project management", "agile", "stakeholder management"],
        "optional": ["pmp", "scrum", "risk management", "uat", "jira", "oracle"]
    },
    "general": {
        "core": [],
        "optional": []
    }
}

# 🔥 JOB SUGGESTIONS (static demo links)
JOB_DATABASE = {
    "data_analyst": [
        {"title": "Junior Data Analyst", "company": "TCS", "link": "https://www.naukri.com/data-analyst-jobs"},
        {"title": "Business Analyst", "company": "Infosys", "link": "https://www.naukri.com/business-analyst-jobs"}
    ],
    "ml_engineer": [
        {"title": "Machine Learning Engineer", "company": "Amazon", "link": "https://www.naukri.com/machine-learning-engineer-jobs"}
    ],
    "frontend": [
        {"title": "React Developer", "company": "Wipro", "link": "https://www.naukri.com/react-js-developer-jobs"}
    ],
    "backend": [
        {"title": "Backend Developer", "company": "Google", "link": "https://www.naukri.com/backend-developer-jobs"}
    ],
    "project_manager": [
        {"title": "IT Project Manager", "company": "Accenture", "link": "https://www.naukri.com/project-manager-jobs"},
        {"title": "Program Manager", "company": "Capgemini", "link": "https://www.naukri.com/program-manager-jobs"}
    ],
    "general": []
}

# 🔥 CLEAN TEXT
def clean_text(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s+]', ' ', text)
    return text


# 🔥 ROLE DETECTION
def detect_role(text):
    text = text.lower()

    if any(x in text for x in ["machine learning", "deep learning", "nlp"]):
        return "ml_engineer"
    elif any(x in text for x in ["react", "frontend", "javascript"]):
        return "frontend"
    elif any(x in text for x in ["api", "backend", "django", "node"]):
        return "backend"
    elif any(x in text for x in ["project manager", "pmp", "stakeholder"]):
        return "project_manager"
    elif any(x in text for x in ["data analyst", "sql", "pandas"]):
        return "data_analyst"

    return "general"


# 🔥 SKILL MATCH
def extract_skills(text, skill_list):
    found = []
    for skill in skill_list:
        if skill in text:
            found.append(skill)
    return found


# 🔥 MAIN ANALYZER
def analyze_resume(resume_text, job_description):
    resume_text = clean_text(resume_text)
    job_description = clean_text(job_description)

    # 1️⃣ Detect role
    role = detect_role(job_description)

    core_skills = ROLE_SKILLS[role]["core"]
    optional_skills = ROLE_SKILLS[role]["optional"]

    # 2️⃣ Extract skills
    resume_core = extract_skills(resume_text, core_skills)
    resume_optional = extract_skills(resume_text, optional_skills)

    # 3️⃣ Matching
    matched_core = list(set(resume_core))
    matched_optional = list(set(resume_optional))
    missing_core = list(set(core_skills) - set(resume_core))

    # 4️⃣ Weighted scoring
    core_score = (len(matched_core) / len(core_skills)) * 70 if core_skills else 0
    optional_score = (len(matched_optional) / len(optional_skills)) * 30 if optional_skills else 0
    keyword_score = core_score + optional_score

    # 5️⃣ Basic semantic similarity
    resume_words = set(resume_text.split())
    jd_words = set(job_description.split())
    common_words = resume_words & jd_words
    tfidf_score = min((len(common_words) / 50) * 100, 100)

    # 6️⃣ Final score
    final_score = round((0.7 * keyword_score) + (0.3 * tfidf_score), 2)

    # 7️⃣ Suggested jobs
    suggested_jobs = JOB_DATABASE.get(role, [])

    return {
        "match_score": final_score,
        "tfidf_score": round(tfidf_score, 2),
        "keyword_match": round(keyword_score, 2),
        "matched_skills": matched_core + matched_optional,
        "missing_skills": missing_core,
        "explanation": f"Role detected: {role}. Matched {len(matched_core)} core and {len(matched_optional)} optional skills.",
        "interview_questions": [
            f"Explain your experience with {skill}" for skill in (matched_core + matched_optional)[:3]
        ],
        "suggested_jobs": suggested_jobs
    }