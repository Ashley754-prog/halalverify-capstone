---
title: HalalVerify API
emoji: 🔍
colorFrom: green
colorTo: emerald
sdk: docker
app_port: 7860
pinned: false
---

# HalalVerify AI Computer Vision Microservice

FastAPI backend microservice for HalalVerify capstone system:
- **Halal Logo Localization**: Ultralytics YOLOv8-Nano (CNN)
- **Ingredient Text Extraction**: EasyOCR (CRAFT + CRNN)
- **Additive Database Screening**: Supabase PostgreSQL 135-additive Lexicon
- **Decision Engine**: Hierarchical 5-stage compliance classifier
