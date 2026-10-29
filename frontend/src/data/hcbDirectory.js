/**
 * HalalVerify Certifying Body (HCB) Directory & Knowledge Base
 * Authoritative profiles for all officially accredited and recognized
 * Halal Certifying Bodies in the Philippines and key international trade partners.
 *
 * Sources:
 * - Philippine Halal Board (Republic Act No. 10817)
 * - National Commission on Muslim Filipinos (NCMF - Republic Act No. 9997)
 * - DTI - Philippine Accreditation Bureau (PAB)
 * - World Halal Council (WHC) & World Halal Food Council (WHFC)
 * - Standards: PNS 2067:2008, OIC/SMIIC 1:2019, ISO/IEC 17065
 */

export const HCB_DIRECTORY = {
    IDCP: {
        code: 'IDCP',
        name: "Islamic Da'wah Council of the Philippines, Inc.",
        shortName: 'IDCP Halal',
        logoSrc: '/logos/IDCP.jpg',
        category: 'National Accredited HCB',
        country: 'Philippines',
        flag: '🇵🇭',
        status: 'Accredited',
        statusBadge: 'DTI-PAB & NCMF Accredited',
        founded: '1982',
        headquarters: 'Escolta, Binondo, City of Manila',
        legalMandate: 'Republic Act No. 10817 (Philippine Halal Export Act), RA 9997, and Supreme Court Ruling G.R. No. 153888 affirming legitimate Halal certifying autonomy.',
        standards: [
            'PNS 2067:2008 (Philippine National Standard for Halal Food)',
            'OIC / SMIIC 1:2019 General Requirements for Halal Food',
            'ISO/IEC 17065 Conformity Assessment',
            'Codex Alimentarius Halal Guidelines (CAC/GL 24-1997)',
        ],
        affiliations: [
            'World Halal Council (WHC) - Founding & Executive Member',
            'Regional Islamic Da\'wah Council of Southeast Asia and the Pacific (RISEAP)',
            'Philippine Halal Board (DTI Member Certifier)',
            'Mutually Recognized by JAKIM (Malaysia), BPJPH (Indonesia), and MUIS (Singapore)',
        ],
        auditingScope: [
            'Processed Food & Beverage Manufacturing Facilities',
            'Food Additives, Flavorings, Emulsifiers, and Chemical Ingredients',
            'Industrial Poultry & Cattle Abattoirs (Slaughterhouses)',
            'Personal Care Products, Cosmetics, and Toiletries',
            'Pharmaceuticals, Herbal Supplements, and Nutritive Oils',
            'Food Packaging, Cold Chain Logistics, and Storage Facilities',
        ],
        overview:
            'Founded in 1982 by a coalition of Muslim leaders, scholars, and professionals across the Philippines, the Islamic Da\'wah Council of the Philippines (IDCP) is one of the most prominent and historically established Halal certifying bodies in the nation. IDCP operates rigorous multi-stage audits including chemical laboratory screening, Shari\'ah verification of raw material supply chains, and mandatory on-site inspection of manufacturing plants.',
        consumerAssurance:
            'An IDCP Halal seal confirms that the food processing facility, handling equipment, and declared ingredients—including enzymes, glycerol, and stabilizers—have been audited on-site and verified free from non-halal animal derivatives (such as pork, lard, or uncertified tallow) and intoxicating substances.',
        website: 'https://www.idcphalal.org',
        registryUrl: 'https://www.idcphalal.org/certified-clients',
        phone: '+63 (2) 8241-0164 / +63 (2) 8241-0165',
        email: 'info@idcphalal.org',
        address: 'Suite 400-402, FUBC Building, 413 Escolta Street, Binondo, Manila 1006, Philippines',
    },

    HDIP: {
        code: 'HDIP',
        name: 'Halal Development Institute of the Philippines, Inc.',
        shortName: 'HDIP Halal',
        logoSrc: '/logos/HDIP.jpg',
        category: 'National Accredited HCB',
        country: 'Philippines',
        flag: '🇵🇭',
        status: 'Accredited',
        statusBadge: 'NCMF & DTI Recognized',
        founded: '2008',
        headquarters: 'Fairview, Quezon City, Metro Manila',
        legalMandate: 'Republic Act No. 9997 (National Commission on Muslim Filipinos Act) and Republic Act No. 10817.',
        standards: [
            'PNS 2067:2008 (Philippine National Standard for Halal Food)',
            'OIC / SMIIC 1:2019',
            'World Halal Food Council (WHFC) Standards',
            'ISO/IEC 17065 Quality Management',
        ],
        affiliations: [
            'World Halal Food Council (WHFC) - Certified Member',
            'National Commission on Muslim Filipinos (NCMF)',
            'Philippine Chamber of Commerce and Industry (PCCI)',
        ],
        auditingScope: [
            'Food & Beverage Processing Plants',
            'Catering, Institutional Kitchens, and Fast Food Chains',
            'Flavors, Food Colors, Preservatives, and Food Additives',
            'FMCG Packaging Materials and Liner Integrity',
            'Warehouse, Transport, and Cold Storage Logistics',
        ],
        overview:
            'The Halal Development Institute of the Philippines (HDIP) is a pioneer in technical Halal assurance and scientific food safety verification. HDIP conducts meticulous plant inspections, auditing ingredient traceability, HACCP food hygiene compliance, and rigorous segregation of halal and non-halal supply lines.',
        consumerAssurance:
            'The HDIP seal assures consumers that all critical control points in production adhere to Islamic law, guaranteeing that emulsifiers, animal derivatives, and manufacturing lines have zero risk of cross-contamination.',
        website: 'https://hdiphilippineshalal.com',
        registryUrl: 'https://hdiphilippineshalal.com/directory',
        phone: '+63 (2) 8930-6712',
        email: 'hdiphilippines@gmail.com',
        address: 'Blk 12 Lot 18, Bristol St., North Fairview, Quezon City, Metro Manila, Philippines',
    },

    NCMF: {
        code: 'NCMF',
        name: 'National Commission on Muslim Filipinos (Philippine National Halal Seal)',
        shortName: 'NCMF Halal Board',
        logoSrc: '/logos/NCMF.jpg',
        category: 'Government Oversight & National Seal',
        country: 'Philippines',
        flag: '🇵🇭',
        status: 'National Authority',
        statusBadge: 'Republic Act No. 9997 & RA 10817',
        founded: '2010',
        headquarters: 'Commonwealth Avenue, Diliman, Quezon City',
        legalMandate: 'Republic Act No. 9997 (NCMF Act of 2009) creating the National Commission on Muslim Filipinos, and Republic Act No. 10817 designating NCMF as Co-Chair of the Philippine Halal Export Development and Promotion Board.',
        standards: [
            'Philippine National Standards (PNS 2067:2008)',
            'Philippine Halal Board Unified Guidelines',
            'OIC / SMIIC Standards Framework',
        ],
        affiliations: [
            'Department of Trade and Industry (DTI) - Joint Halal Board',
            'BIMP-EAGA Halal Working Group',
            'Department of Science and Technology (DOST) Halal Science Laboratory',
            'Department of Agriculture (DA) Halal Food Industry Development Program',
        ],
        auditingScope: [
            'National Accreditation Oversight of all Philippine Halal Certifying Bodies',
            'Government Halal Policy, Export Standards, and Inter-Agency Regulation',
            'Accredited Slaughterhouses, Meat Processing, and Agricultural Exports',
            'Halal Tourism, Hospitality Establishments, and Medical Kitchens',
        ],
        overview:
            'The National Commission on Muslim Filipinos (NCMF) is the primary Philippine government agency mandated to preserve, develop, and promote the well-being, culture, and religious rights of Muslim Filipinos. Under RA 10817 and RA 9997, the NCMF oversees the accreditation of all legitimate Halal Certifying Bodies in the Philippines and promotes the unified Philippine National Halal Logo for domestic and global commerce.',
        consumerAssurance:
            'The Philippine National Halal Seal under NCMF oversight represents the highest level of government-backed integrity, backed by inter-agency collaboration with DOST laboratory testing and DTI accreditation.',
        website: 'https://www.ncmf.gov.ph',
        registryUrl: 'https://www.ncmf.gov.ph/halal-directory',
        phone: '+63 (2) 8952-4875 / +63 (2) 8952-4876',
        email: 'info@ncmf.gov.ph',
        address: '79 Jocfer Annex Building, Commonwealth Avenue, Diliman, Quezon City, Metro Manila, Philippines',
    },

    MMHCB: {
        code: 'MMHCB',
        name: 'Muslim Mindanao Halal Certification Board, Inc.',
        shortName: 'MMHCB Halal',
        logoSrc: '/logos/MMHCB.png',
        category: 'Regional Mindanao HCB',
        country: 'Philippines',
        flag: '🇵🇭',
        status: 'Accredited',
        statusBadge: 'NCMF Accredited (Mindanao)',
        founded: '2006',
        headquarters: 'Davao City, Davao del Sur, Mindanao',
        legalMandate: 'Accredited under NCMF Guidelines and recognized by the Mindanao Development Authority (MinDA) and BARMM Ministry of Trade, Investments and Tourism.',
        standards: [
            'PNS 2067:2008 (Philippine Halal Standard)',
            'OIC / SMIIC 1:2019',
            'ISO/IEC 17065 Conformity',
        ],
        affiliations: [
            'National Commission on Muslim Filipinos (NCMF)',
            'Mindanao Development Authority (MinDA)',
            'Davao City Halal Industry Development Council',
        ],
        auditingScope: [
            'Mindanao Agricultural Crops (Banana, Pineapple, Coconut, Cacao, Durian)',
            'Commercial Fisheries, Tuna Canning, and Aquaculture Processing',
            'Regional Food Manufacturing & Snack Packaging Plants',
            'Hotels, Food Service, and Halal Tourism Facilities in Southern Philippines',
        ],
        overview:
            'The Muslim Mindanao Halal Certification Board (MMHCB) was established by Islamic scholars (Ulama) and technical food scientists in Davao City to serve Mindanao’s booming agricultural and food export industries. MMHCB is recognized across the Brunei-Indonesia-Malaysia-Philippines East ASEAN Growth Area (BIMP-EAGA).',
        consumerAssurance:
            'Products carrying the MMHCB seal have been inspected by Ulama audit teams and laboratory-certified against non-halal enzymes, uncertified gelatin, or pork-derived gelatin in processing.',
        website: 'https://mmhcb.org.ph',
        registryUrl: 'https://mmhcb.org.ph/verified-directory',
        phone: '+63 (82) 222-3849',
        email: 'info@mmhcb.org.ph',
        address: 'Door 2, Juna Subd., Matina, Davao City 8000, Davao del Sur, Philippines',
    },

    HICCIP: {
        code: 'HICCIP',
        name: 'Halal International Chamber of Commerce and Industries of the Philippines Inc.',
        shortName: 'HICCIP Halal',
        logoSrc: '/logos/HICCIP.png',
        category: 'National Accredited HCB',
        country: 'Philippines',
        flag: '🇵🇭',
        status: 'Accredited',
        statusBadge: 'DTI-PAB & NCMF Accredited',
        founded: '2010',
        headquarters: 'Makati City, Metro Manila',
        legalMandate: 'Accredited by the Department of Trade and Industry - Philippine Accreditation Bureau (DTI-PAB) and NCMF.',
        standards: [
            'ISO/IEC 17065 (PAB Accredited Scope)',
            'PNS 2067:2008 Halal Standard',
            'UAE.S 2055-1 / GSO 2055-1 (GCC Export Standard)',
        ],
        affiliations: [
            'DTI Philippine Accreditation Bureau (PAB)',
            'International Halal Accreditation Forum (IHAF)',
            'GCC Standardization Organization (GSO)',
        ],
        auditingScope: [
            'Large-Scale FMCG Food & Beverage Exporters',
            'Dairy, Margarine, Bakery Emulsifiers, and Confectionery',
            'Chemical Intermediates and Industrial Additives',
            'Nutraceuticals, Pharmaceuticals, and Personal Care',
        ],
        overview:
            'HICCIP is an internationally accredited Halal certification body with formal accreditation under ISO/IEC 17065 from the Philippine Accreditation Bureau (PAB). It specializes in helping Philippine manufacturers comply with strict Gulf (UAE, Saudi Arabia) and ASEAN export standards.',
        consumerAssurance:
            'The HICCIP seal guarantees full compliance with international ISO and GSO Halal conformity standards, ensuring that raw material origins and production line sanitation strictly prohibit contamination.',
        website: 'https://hiccip.org',
        registryUrl: 'https://hiccip.org/certified-companies',
        phone: '+63 (2) 8804-2577',
        email: 'info@hiccip.org',
        address: 'Unit 401, Century Plaza, 120 Perea St., Legaspi Village, Makati City, Metro Manila, Philippines',
    },

    PRIME: {
        code: 'PRIME',
        name: 'Prime Certification and Inspection Asia Pacific, Inc.',
        shortName: 'PRIME Group Halal',
        logoSrc: '/logos/PRIME.png',
        category: 'International Recognized Partner',
        country: 'Philippines / UAE',
        flag: '🇦🇪 🇵🇭',
        status: 'Accredited',
        statusBadge: 'PAB, EIAC & GSO Accredited',
        founded: '2012',
        headquarters: 'Bonifacio Global City (BGC), Taguig / Dubai, UAE',
        legalMandate: 'Multi-jurisdictional accreditation from EIAC (Emirates International Accreditation Centre), GSO, and DTI-PAB.',
        standards: [
            'GSO 2055-1:2015 (Gulf Halal Standard)',
            'UAE.S 2055-1',
            'ISO/IEC 17065:2012 Conformity Assessment',
            'PNS 2067:2008',
        ],
        affiliations: [
            'Emirates International Accreditation Centre (EIAC)',
            'GCC Standardization Organization (GSO)',
            'Philippine Accreditation Bureau (DTI-PAB)',
        ],
        auditingScope: [
            'Multinational Food & Beverage Exporters to the Middle East & North Africa (MENA)',
            'Meat & Poultry Processing, Packaging, and Cold Logistics',
            'Pharmaceuticals, Cosmetics, and Personal Care Formulations',
        ],
        overview:
            'PRIME Certification is a premier global conformity assessment and testing agency headquartered in the UAE with Philippine regional operations. It is officially authorized to certify goods for export to Saudi Arabia, UAE, Qatar, and the entire GCC block.',
        consumerAssurance:
            'Guarantees strict compliance with Gulf and international Halal standards, including rigorous chemical audits and continuous batch supervision.',
        website: 'https://primegroup.com',
        registryUrl: 'https://primegroup.com/services/halal-certification',
        phone: '+63 (2) 8403-6905',
        email: 'philippines@primegroup.com',
        address: '26th Floor, High Street South Corporate Plaza, BGC, Taguig City, Metro Manila, Philippines',
    },

    BUSC: {
        code: 'BUSC',
        name: 'Basilan Ulama Supreme Council Foundation Inc.',
        shortName: 'BUSC Halal',
        logoSrc: '/logos/BUSC.png',
        category: 'Regional Mindanao HCB',
        country: 'Philippines',
        flag: '🇵🇭',
        status: 'Accredited',
        statusBadge: 'NCMF Accredited (Region IX & Basilan)',
        founded: '2009',
        headquarters: 'Isabela City, Basilan / Zamboanga City (Region IX)',
        legalMandate: 'Accredited by the National Commission on Muslim Filipinos (NCMF) under RA 9997. Official Halal authority across Western Mindanao and the Zamboanga Peninsula.',
        standards: [
            'PNS 2067:2008 (Philippine Halal Standard)',
            'NCMF Halal Guidelines for Food Establishments & MSMEs',
            'Zamboanga City Ordinance No. 489 (Halal Food Segregation)',
        ],
        affiliations: [
            'National Commission on Muslim Filipinos (NCMF Region IX)',
            'Bangsamoro Darul-Ifta\' (BARMM)',
            'City Government of Zamboanga Halal Board',
            'DTI Region IX Zamboanga Peninsula',
        ],
        auditingScope: [
            'Zamboanga Peninsula & Basilan Food Establishments, Restaurants, and Cafes',
            'Hospital Dietary Kitchens (e.g. ZCMC, West Metro Medical Center)',
            'Artisan Bakeries, Native Delicacies, and Confectioneries (e.g. Auntie Nit\'z, MCH Carmela)',
            'Gourmet Seafood Processing (Spanish Sardines in Corn Oil, Smoked Fish, Tuyo Flakes)',
            'Local MSME Packaged Agro-Products (Calamansi Juice, Coco Sugar, Cassava)',
        ],
        overview:
            'The Basilan Ulama Supreme Council (BUSC) is the leading Shari\'ah Halal certifying authority for Zamboanga City, Region IX, and Basilan. BUSC conducts direct quadrimester audits of regional restaurants, hospital kitchens, bakeries, and gourmet sardine producers to guarantee compliance with Islamic dietary principles and local ordinances.',
        consumerAssurance:
            'A BUSC certificate confirms that local food processors use 100% Halal-compliant cooking oils, verified raw ingredients, and segregated preparation surfaces free from non-halal contamination.',
        website: 'https://buschalal.org',
        registryUrl: 'https://buschalal.org/certified-directory',
        phone: '+63 (62) 991-2384',
        email: 'buscfoundation@gmail.com',
        address: 'N. Valderrosa St., Isabela City, Basilan / Liaison Office: Tetuan, Zamboanga City, Philippines',
    },

    BPCC: {
        code: 'BPCC',
        name: 'Bangsamoro Provincial Consultative Council, Inc.',
        shortName: 'BPCC Halal',
        logoSrc: '/logos/BPCC.png',
        category: 'Regional Mindanao HCB',
        country: 'Philippines',
        flag: '🇵🇭',
        status: 'Accredited',
        statusBadge: 'NCMF Accredited (BARMM / Region IX)',
        founded: '2011',
        headquarters: 'Pagadian City, Zamboanga del Sur',
        legalMandate: 'Accredited by NCMF under RA 9997 and recognized in BARMM and Region IX.',
        standards: [
            'PNS 2067:2008',
            'NCMF Halal Assurance System',
        ],
        affiliations: [
            'National Commission on Muslim Filipinos (NCMF)',
            'DTI Zamboanga del Sur Provincial Office',
        ],
        auditingScope: [
            'Regional Food Cooperatives and Agricultural Producer Associations',
            'Bakeries, Rice Mills, and Snack Manufacturing',
            'Organic Eco-Farms and Calamansi Agro-Enterprises',
        ],
        overview:
            'BPCC provides Halal certification and technical training to agricultural cooperatives, MSMEs, and local food processors across Zamboanga del Sur, Zamboanga Sibugay, and adjacent provinces.',
        consumerAssurance:
            'Verifies that community-level agricultural produce and packaged bakery goods adhere to strict Halal hygiene and ingredient sourcing rules.',
        website: 'https://bpcc-halal.org',
        registryUrl: 'https://bpcc-halal.org/directory',
        phone: '+63 (62) 214-1902',
        email: 'bpcc.halal@gmail.com',
        address: 'Rizal Avenue, Gatas District, Pagadian City, Zamboanga del Sur, Philippines',
    },

    MINHA: {
        code: 'MinHA',
        name: 'Mindanao Halal Authority, Inc.',
        shortName: 'MinHA Halal',
        logoSrc: '/logos/MinHA.png',
        category: 'Regional Mindanao HCB',
        country: 'Philippines',
        flag: '🇵🇭',
        status: 'Accredited',
        statusBadge: 'NCMF Accredited (SOCCSKSARGEN)',
        founded: '2009',
        headquarters: 'General Santos City, South Cotabato',
        legalMandate: 'Accredited by the National Commission on Muslim Filipinos (NCMF).',
        standards: ['PNS 2067:2008', 'OIC / SMIIC 1:2019', 'HACCP Halal Integration'],
        affiliations: ['NCMF', 'General Santos City Chamber of Commerce', 'Tuna Industry Association of the Philippines'],
        auditingScope: [
            'Deep-Sea Tuna Processing and Canning Exporters',
            'Aquaculture, Shrimp, and Seaweed Processing Plants',
            'Tropical Fruit Canning (Pineapple, Mango, Papaya)',
        ],
        overview:
            'Headquartered in the Tuna Capital of the Philippines, MinHA specializes in certifying large marine seafood processors, aquaculture exporters, and agro-industrial plants for global Muslim export markets.',
        consumerAssurance:
            'Ensures tuna and seafood canning facilities use 100% plant-derived broths, halal-certified vegetable oils, and certified additives with zero cross-contact.',
        website: 'https://minha.org.ph',
        registryUrl: 'https://minha.org.ph/registered-firms',
        phone: '+63 (83) 552-4411',
        email: 'info@minha.org.ph',
        address: 'Santiago Blvd., General Santos City, South Cotabato 9500, Philippines',
    },

    PUCOI: {
        code: 'PUCOI',
        name: 'Philippine Ulama Congress Organization, Inc.',
        shortName: 'PUCOI Halal',
        logoSrc: '/logos/PUCOI.png',
        category: 'National Accredited HCB',
        country: 'Philippines',
        flag: '🇵🇭',
        status: 'Accredited',
        statusBadge: 'NCMF Accredited',
        founded: '2001',
        headquarters: 'Cotabato City, BARMM',
        legalMandate: 'Accredited by NCMF under RA 9997.',
        standards: ['PNS 2067:2008', 'Islamic Shari\'ah Jurisprudence of Halal & Thayyib'],
        affiliations: ['NCMF', 'Bangsamoro Darul-Ifta\'', 'Philippine Halal Board'],
        auditingScope: [
            'Halal Livestock & Poultry Slaughterhouses',
            'Meat Processing & Cold Storage Facilities',
            'Consumer Food Products & Condiments',
        ],
        overview:
            'Led by prominent Islamic scholars and muftis across Mindanao, PUCOI provides authoritative religious certification focusing on the strict humane slaughter of animals and adherence to Islamic jurisprudence.',
        consumerAssurance:
            'Guarantees verified Islamic slaughter (Zabihah) without mechanical strangulation and strictly plant-derived processing aids.',
        website: 'https://pucoi.org',
        registryUrl: 'https://pucoi.org/halal-directory',
        phone: '+63 (64) 421-7890',
        email: 'pucoi.halal@gmail.com',
        address: 'Sinsuat Avenue, Cotabato City 9600, BARMM, Philippines',
    },

    AHIP: {
        code: 'AHIP',
        name: 'Alliances for Halal Integrity of the Philippines, Inc.',
        shortName: 'AHIP Halal',
        logoSrc: '/logos/AHIP.png',
        category: 'National Accredited HCB',
        country: 'Philippines',
        flag: '🇵🇭',
        status: 'Accredited',
        statusBadge: 'NCMF Accredited',
        founded: '2010',
        headquarters: 'Quezon City, Metro Manila',
        legalMandate: 'Accredited by NCMF under RA 9997.',
        standards: ['PNS 2067:2008', 'ISO 22000 / HACCP Food Safety Halal Standards'],
        affiliations: ['NCMF', 'Philippine Food Processors and Exporters Organization (PHILFOODEX)'],
        auditingScope: ['Commercial Food Processing', 'Sauces, Spices & Seasonings', 'Confectionery & Bakery Products'],
        overview:
            'AHIP is dedicated to elevating Halal integrity through technical audits and standardizing chemical additive testing for commercial food manufacturing companies.',
        consumerAssurance:
            'Verifies that flavoring agents, extracts, and carrier solvents meet strict non-alcoholic and non-porcine purity thresholds.',
        website: 'https://ahiphalal.org',
        registryUrl: 'https://ahiphalal.org/clients',
        phone: '+63 (2) 8374-1299',
        email: 'info@ahiphalal.org',
        address: 'Timog Avenue, South Triangle, Quezon City, Metro Manila, Philippines',
    },

    PHILCOSED: {
        code: 'Philcosed',
        name: 'Philippine Ligawasan Marsh Conservation and Socio-Economic Development, Inc.',
        shortName: 'PHILCOSED Halal',
        logoSrc: '/logos/Philcosed.png',
        category: 'Regional Mindanao HCB',
        country: 'Philippines',
        flag: '🇵🇭',
        status: 'Accredited',
        statusBadge: 'NCMF Accredited (Central Mindanao)',
        founded: '2012',
        headquarters: 'Pikit, Cotabato / Maguindanao',
        legalMandate: 'Accredited by NCMF under RA 9997.',
        standards: ['PNS 2067:2008', 'Eco-Halal Sustainable Agricultural Framework'],
        affiliations: ['NCMF', 'BARMM Ministry of Agriculture, Fisheries and Agrarian Reform (MAFAR)'],
        auditingScope: [
            'Freshwater Fisheries & Organic Aquaculture',
            'Rice & Corn Flour Processing Plants',
            'Palm Oil & Coconut Agro-Enterprises',
        ],
        overview:
            'PHILCOSED integrates ecological sustainability with Islamic Halal principles, certifying agricultural and freshwater food processors throughout Central Mindanao and the Ligawasan Marsh basin.',
        consumerAssurance:
            'Guarantees pure natural agro-commodities produced without synthetic prohibited animal growth agents or doubtful chemical preservatives.',
        website: 'https://philcosed.org',
        registryUrl: 'https://philcosed.org/registry',
        phone: '+63 (64) 577-1234',
        email: 'info@philcosed.org',
        address: 'Poblacion, Pikit, Cotabato 9409, Philippines',
    },

    MASLAHA: {
        code: 'MASLAHA',
        name: 'Maslaha Halal Certification Board, Inc.',
        shortName: 'MASLAHA Halal',
        logoSrc: '/logos/MASLAHA.png',
        category: 'National Accredited HCB',
        country: 'Philippines',
        flag: '🇵🇭',
        status: 'Accredited',
        statusBadge: 'NCMF Accredited',
        founded: '2013',
        headquarters: 'Marawi City, Lanao del Sur',
        legalMandate: 'Accredited by NCMF under RA 9997.',
        standards: ['PNS 2067:2008', 'Shari\'ah Maslahah Welfare Standards'],
        affiliations: ['NCMF', 'Lanao del Sur Provincial Halal Board'],
        auditingScope: ['Food Manufacturing', 'Snack Packaging', 'Local Hospitality & Eateries'],
        overview:
            'Maslaha Halal Certification Board focuses on consumer welfare (Maslahah) and rigorous food authenticity audits for producers across the Bangsamoro region and Northern Mindanao.',
        consumerAssurance:
            'Ensures honest labeling, absence of doubtful animal fats, and clean hygienic handling.',
        website: 'https://maslahahalal.org',
        registryUrl: 'https://maslahahalal.org/directory',
        phone: '+63 (63) 520-9182',
        email: 'maslaha.halal@gmail.com',
        address: 'Quezon Avenue, Marawi City, Lanao del Sur 9700, Philippines',
    },

    FIQHI: {
        code: 'FIQHI',
        name: 'Fiqhi and Halal Council of the Philippines, Inc.',
        shortName: 'FIQHI Halal',
        logoSrc: '/logos/FIQHI.png',
        category: 'National Accredited HCB',
        country: 'Philippines',
        flag: '🇵🇭',
        status: 'Accredited',
        statusBadge: 'NCMF Accredited',
        founded: '2014',
        headquarters: 'Cagayan de Oro City, Misamis Oriental',
        legalMandate: 'Accredited by NCMF under RA 9997.',
        standards: ['PNS 2067:2008', 'Fiqh-al-Aqimah Halal Guidelines'],
        affiliations: ['NCMF', 'Northern Mindanao Muslim Council'],
        auditingScope: ['Packaged Consumer Goods', 'Beverage Bottling', 'Bakery Ingredients'],
        overview:
            'The FIQHI Council bridges Islamic jurisprudence with contemporary food science, auditing modern industrial factories across Northern Mindanao.',
        consumerAssurance:
            'Provides Shari\'ah clearance on emulsifying agents, glycerides, and flavoring chemicals.',
        website: 'https://fiqhihalal.org',
        registryUrl: 'https://fiqhihalal.org/directory',
        phone: '+63 (88) 856-3201',
        email: 'fiqhihalal@gmail.com',
        address: 'J.V. Seriña St., Carmen, Cagayan de Oro City 9000, Philippines',
    },

    // Major International Recognized Partner Bodies (ASEAN / GCC)
    JAKIM: {
        code: 'JAKIM',
        name: 'Jabatan Kemajuan Islam Malaysia (Department of Islamic Development Malaysia)',
        shortName: 'JAKIM Malaysia',
        logoSrc: null,
        category: 'International Recognized Partner',
        country: 'Malaysia',
        flag: '🇲🇾',
        status: 'Foreign Official Authority',
        statusBadge: 'Officially Recognized by DTI & NCMF',
        founded: '1997',
        headquarters: 'Putrajaya, Malaysia',
        legalMandate: 'Prime Minister\'s Department of Malaysia Halal Certification Division, custodian of Malaysia Halal Standard MS 1500:2019.',
        standards: [
            'MS 1500:2019 (Halal Food - Production, Preparation, Handling and Storage)',
            'ISO/IEC 17065 Compliance',
            'Manual Procedure for Malaysia Halal Certification (MPPHM 2020)',
        ],
        affiliations: [
            'International Halal Authority Board (IHAB)',
            'BIMP-EAGA Halal Cooperation Forum',
            'Mutually Recognized by Philippine DTI / NCMF under ASEAN Halal MoUs',
        ],
        auditingScope: [
            'Imported Packaged Food & Beverage from Malaysia and Global MNCs',
            'Flavorings, Animal Feed, Emulsifiers, and Bio-Chemicals',
            'Cosmetics, Toiletries, Pharmaceuticals, and Medical Devices',
        ],
        overview:
            'JAKIM is internationally recognized as the gold standard in Halal certification. Products bearing the JAKIM seal have undergone comprehensive scientific laboratory testing and supply-chain audits benchmarked across global Islamic commerce.',
        consumerAssurance:
            'A genuine JAKIM seal confirms that all emulsifiers, additives, and meat ingredients strictly adhere to the highest standard of Halal food production in the world.',
        website: 'https://www.halal.gov.my',
        registryUrl: 'https://www.halal.gov.my/v4/index.php?data=direktori_luar_negara',
        phone: '+60 3-8892 5000',
        email: 'pr_halal@islam.gov.my',
        address: 'Blok D, Kompleks Islam Putrajaya, No. 3, Jalan Tun Abdul Razak, Presint 3, 62100 Putrajaya, Malaysia',
    },

    BPJPH: {
        code: 'BPJPH',
        name: 'Badan Penyelenggara Jaminan Produk Halal (BPJPH / LPPOM MUI - Indonesia)',
        shortName: 'BPJPH / MUI Indonesia',
        logoSrc: null,
        category: 'International Recognized Partner',
        country: 'Indonesia',
        flag: '🇮🇩',
        status: 'Foreign Official Authority',
        statusBadge: 'Officially Recognized by DTI & NCMF',
        founded: '2017 (MUI: 1989)',
        headquarters: 'Jakarta, Indonesia',
        legalMandate: 'Indonesian Law No. 33 of 2014 concerning Halal Product Assurance (Jaminan Produk Halal - JPH) under the Ministry of Religious Affairs.',
        standards: [
            'HAS 23000 (Halal Assurance System)',
            'Indonesian National Standard (SNI) 99001:2016',
            'ISO/IEC 17065 Accreditation',
        ],
        affiliations: [
            'Majelis Ulama Indonesia (MUI Fatwa Commission)',
            'World Halal Food Council (WHFC)',
            'Mutually Recognized with the Philippines under DTI-BPJPH Bilateral Halal Agreement',
        ],
        auditingScope: [
            'Imported Food & Beverage from Indonesia and Global FMCG Brands',
            'Chemical Ingredients, Emulsifiers (E471, E476), Gelatin, and Flavorings',
            'Cosmetics, Skincare, Household Goods, and Pharmaceuticals',
        ],
        overview:
            'BPJPH is Indonesia’s official government agency responsible for Halal Product Assurance, operating in conjunction with the Majelis Ulama Indonesia (MUI) Fatwa Committee and accredited Halal Inspection Agencies (LPH). Indonesia enforces mandatory Halal certification for all food and beverage products.',
        consumerAssurance:
            'The Indonesian Halal seal (BPJPH / MUI) confirms that the product has undergone strict laboratory testing (including DNA porcine testing) and complies with the internationally respected HAS 23000 framework.',
        website: 'https://bpjph.halal.go.id',
        registryUrl: 'https://bpjph.halal.go.id/search/sertifikat',
        phone: '+62 (21) 3483-3004',
        email: 'layanan@bpjph.go.id',
        address: 'Jl. Raya Pondok Gede No. 13, Pinang Ranti, Makassar, Kota Jakarta Timur, DKI Jakarta 13560, Indonesia',
    },

    MUIS: {
        code: 'MUIS',
        name: 'Majlis Ugama Islam Singapura (Islamic Religious Council of Singapore)',
        shortName: 'MUIS Singapore',
        logoSrc: null,
        category: 'International Recognized Partner',
        country: 'Singapore',
        flag: '🇸🇬',
        status: 'Foreign Official Authority',
        statusBadge: 'Officially Recognized by DTI & NCMF',
        founded: '1968 (Halal Unit: 1978)',
        headquarters: 'Singapore',
        legalMandate: 'Statutory Board under the Administration of Muslim Law Act (AMLA) of Singapore.',
        standards: [
            'Singapore Muis Halal Standard (SMHS - Muis-HC-S001 / S002)',
            'ISO/IEC 17065 Alignment',
        ],
        affiliations: [
            'MABIMS (Ministers of Religion of Brunei, Indonesia, Malaysia, and Singapore)',
            'World Halal Council Partner',
        ],
        auditingScope: ['Eating Establishments', 'Food Manufacturing Facilities', 'Poultry Abattoirs', 'Storage and Logistics'],
        overview:
            'MUIS is the statutory Islamic religious authority in Singapore, managing one of the most respected Halal certification systems in Southeast Asia.',
        consumerAssurance:
            'Guarantees world-class urban food technology audits with zero cross-contamination and transparent ingredient traceability.',
        website: 'https://www.muis.gov.sg',
        registryUrl: 'https://www.muis.gov.sg/halal/halal-certification/certified-companies',
        phone: '+65 6359 1199',
        email: 'info@muis.gov.sg',
        address: 'Singapore Islamic Hub, 273 Braddell Road, Singapore 579702',
    },

    CICOT: {
        code: 'CICOT',
        name: 'Central Islamic Council of Thailand (CICOT)',
        shortName: 'CICOT Thailand',
        logoSrc: null,
        category: 'International Recognized Partner',
        country: 'Thailand',
        flag: '🇹🇭',
        status: 'Foreign Official Authority',
        statusBadge: 'Officially Recognized by DTI & NCMF',
        founded: '1997',
        headquarters: 'Bangkok, Thailand',
        legalMandate: 'Islamic Administration Act B.E. 2540 (1997) of the Kingdom of Thailand.',
        standards: ['Halal Standard Institute of Thailand (HSIT)', 'Codex General Halal Guidelines'],
        affiliations: ['The Halal Science Center Chulalongkorn University', 'BIMP-EAGA'],
        auditingScope: ['Export Agro-Food Processing', 'Rice & Noodle Products', 'Canned Fruits & Seafood', 'Poultry Products'],
        overview:
            'CICOT is Thailand’s sole statutory Islamic certification authority, supported by the world-renowned Halal Science Center at Chulalongkorn University for laboratory forensics.',
        consumerAssurance:
            'Backed by laboratory testing for porcine DNA, alcohol residue, and synthetic contaminants.',
        website: 'https://www.cicot.or.th',
        registryUrl: 'https://www.cicot.or.th/2016/halal-search',
        phone: '+66 (2) 949-4114',
        email: 'info@cicot.or.th',
        address: '45 Moo 3, Klong Kao Road, Khwaeng Khlong Sip, Khet Khlong Sam Wa, Bangkok 10510, Thailand',
    },
};

/**
 * Fallback profile for a generic or ambiguous recognized seal
 */
export const GENERIC_RECOGNIZED_SEAL_PROFILE = {
    code: 'RECOGNIZED_SEAL',
    name: 'Recognized Halal Certifying Body',
    shortName: 'Accredited Halal Seal',
    logoSrc: null,
    category: 'National Accredited HCB',
    country: 'Philippines',
    flag: '🇵🇭',
    status: 'Recognized Mark',
    statusBadge: 'Accredited Philippine Seal',
    founded: 'National Framework',
    headquarters: 'Republic of the Philippines',
    legalMandate: 'Republic Act No. 10817 (Philippine Halal Export Development and Promotion Act) and Republic Act No. 9997.',
    standards: [
        'PNS 2067:2008 (Philippine National Standard for Halal)',
        'OIC / SMIIC 1:2019 General Requirements for Halal Food',
        'ISO/IEC 17065 Conformity Assessment',
    ],
    affiliations: [
        'Philippine Halal Export Development and Promotion Board (DTI)',
        'National Commission on Muslim Filipinos (NCMF)',
        'Department of Science and Technology (DOST) Halal Verification Labs',
    ],
    auditingScope: [
        'Food & Beverage Manufacturing Plants',
        'Biological Additives, Flavorings & Emulsifiers',
        'Poultry & Cattle Slaughterhouses',
        'Retail Consumer Food Packaging',
    ],
    overview:
        'This product exhibits a recognized Halal certification mark conforming to Philippine or international Halal standards. In the Philippines, Halal certifying bodies must be accredited by the Philippine Accreditation Bureau (DTI-PAB) or recognized by the National Commission on Muslim Filipinos (NCMF) pursuant to Republic Act No. 10817.',
    consumerAssurance:
        'Accredited certification ensures that food manufacturing procedures, raw ingredient declarations, and handling lines have undergone on-site inspection and verification to ensure no swine or non-halal animal contamination.',
    website: 'https://www.dti.gov.ph/negosyo/halal/',
    registryUrl: 'https://www.ncmf.gov.ph/halal-directory',
    phone: '+63 (2) 8897-1713',
    email: 'halal@dti.gov.ph',
    address: 'DTI-Competitiveness and Innovation Group, 4F Industry & Investments Bldg., 385 Sen. Gil J. Puyat Ave., Makati City, Philippines',
};

/**
 * Explainer profile when an unaccredited, unrecognized, or suspicious logo is detected
 */
export const UNACCREDITED_MARK_PROFILE = {
    code: 'UNACCREDITED',
    name: 'Unaccredited / Unrecognized Certification Mark',
    shortName: 'Unaccredited Mark',
    logoSrc: '/logos/Invalid_Logo.png',
    category: 'Consumer Warning & Advisory',
    country: 'Unverified Origin',
    flag: '⚠️',
    status: 'Unaccredited',
    statusBadge: 'Not Recognized under PNS 2067 / RA 10817',
    founded: 'N/A',
    headquarters: 'Unverified',
    legalMandate: 'Under Philippine Republic Act No. 10817 and DTI-NCMF Joint Guidelines, only accredited certifying bodies holding valid accreditation certificates are legally recognized.',
    standards: ['Non-Compliant / Unverified Standard'],
    affiliations: ['No recognized affiliation with the Philippine Halal Board, NCMF, or World Halal Council'],
    auditingScope: ['None verified by statutory authorities'],
    overview:
        'The scanner detected a seal, emblem, or mark that does not match any accredited Philippine or international Halal Certifying Body. Manufacturers occasionally print generic, stylized, or counterfeit Halal stamps on packaging without undergoing formal Shari\'ah auditing or chemical lab screening.',
    consumerAssurance:
        'Consumers are strongly advised to exercise caution (Ihtiyat). An unaccredited mark provides zero legal or religious guarantee regarding the origin of gelatin, emulsifiers (e.g. E471, E476), or slaughter methods.',
    website: 'https://www.ncmf.gov.ph',
    registryUrl: 'https://www.dti.gov.ph',
    phone: '+63 (2) 8952-4875',
    email: 'info@ncmf.gov.ph',
    address: 'National Commission on Muslim Filipinos, Commonwealth Ave., Diliman, Quezon City, Philippines',
};

/**
 * Resolves the full HCB Profile from a scanResult or search string
 */
export function getHcbProfile(scanResultOrCode) {
    if (!scanResultOrCode) return GENERIC_RECOGNIZED_SEAL_PROFILE;

    if (typeof scanResultOrCode === 'string') {
        const needle = scanResultOrCode.trim().toUpperCase();
        if (HCB_DIRECTORY[needle]) return HCB_DIRECTORY[needle];
        for (const [key, profile] of Object.entries(HCB_DIRECTORY)) {
            if (needle.includes(key) || needle.includes(profile.name.toUpperCase()) || needle.includes(profile.shortName.toUpperCase())) {
                return profile;
            }
        }
        if (needle.includes('INVALID') || needle.includes('UNACCREDITED') || needle.includes('COUNTERFEIT')) {
            return UNACCREDITED_MARK_PROFILE;
        }
        return GENERIC_RECOGNIZED_SEAL_PROFILE;
    }

    const scanResult = scanResultOrCode;

    if (scanResult.isInvalidLogo) {
        return UNACCREDITED_MARK_PROFILE;
    }

    const candidateCode = (
        scanResult.detectedLogos?.[0]?.class_name ||
        scanResult.visualCandidateCode ||
        scanResult.visualCandidate ||
        ''
    ).toUpperCase();

    const bodyText = (scanResult.logoBody || '').toUpperCase();
    const labelText = (scanResult.detectedLogos?.[0]?.label || '').toUpperCase();
    const combined = `${candidateCode} ${bodyText} ${labelText}`;

    // Exact or direct code match
    for (const [key, profile] of Object.entries(HCB_DIRECTORY)) {
        if (candidateCode === key || candidateCode === key.replace('_', '')) {
            return profile;
        }
    }

    // Keyword heuristics
    if (combined.includes('IDCP') || combined.includes("DA'WAH") || combined.includes('DAWAH') || combined.includes('PHILIPPINES2')) {
        return HCB_DIRECTORY.IDCP;
    }
    if (combined.includes('HDIP') || combined.includes('DEVELOPMENT INSTITUTE') || combined.includes('PHILIPPINES3')) {
        return HCB_DIRECTORY.HDIP;
    }
    if (combined.includes('NCMF') || combined.includes('NATIONAL COMMISSION') || combined.includes('NATIONAL HALAL') || combined.includes('PHILIPPINES1')) {
        return HCB_DIRECTORY.NCMF;
    }
    if (combined.includes('BUSC') || combined.includes('BASILAN') || combined.includes('UNITY SUMMIT')) {
        return HCB_DIRECTORY.BUSC;
    }
    if (combined.includes('BPCC') || combined.includes('BANGSAMORO PROVINCIAL')) {
        return HCB_DIRECTORY.BPCC;
    }
    if (combined.includes('MMHCB') || combined.includes('MINDANAO MUSLIM')) {
        return HCB_DIRECTORY.MMHCB;
    }
    if (combined.includes('HICCIP') || combined.includes('CHAMBER OF COMMERCE')) {
        return HCB_DIRECTORY.HICCIP;
    }
    if (combined.includes('PRIME')) {
        return HCB_DIRECTORY.PRIME;
    }
    if (combined.includes('MINHA') || combined.includes('MINDANAO HALAL AUTHORITY')) {
        return HCB_DIRECTORY.MINHA;
    }
    if (combined.includes('PUCOI') || combined.includes('ULAMA CONGRESS')) {
        return HCB_DIRECTORY.PUCOI;
    }
    if (combined.includes('AHIP') || combined.includes('ALLIANCE FOR HALAL')) {
        return HCB_DIRECTORY.AHIP;
    }
    if (combined.includes('PHILCOSED') || combined.includes('LIGAWASAN')) {
        return HCB_DIRECTORY.PHILCOSED;
    }
    if (combined.includes('MASLAHA')) {
        return HCB_DIRECTORY.MASLAHA;
    }
    if (combined.includes('FIQHI')) {
        return HCB_DIRECTORY.FIQHI;
    }
    if (combined.includes('JAKIM') || combined.includes('MALAYSIA') || combined.includes('MS 1500') || combined.includes('MS1500')) {
        return HCB_DIRECTORY.JAKIM;
    }
    if (combined.includes('BPJPH') || combined.includes('LPPOM') || combined.includes('MUI') || combined.includes('INDONESIA')) {
        return HCB_DIRECTORY.BPJPH;
    }
    if (combined.includes('MUIS') || combined.includes('SINGAPORE')) {
        return HCB_DIRECTORY.MUIS;
    }
    if (combined.includes('CICOT') || combined.includes('THAILAND')) {
        return HCB_DIRECTORY.CICOT;
    }

    return GENERIC_RECOGNIZED_SEAL_PROFILE;
}

export default HCB_DIRECTORY;
