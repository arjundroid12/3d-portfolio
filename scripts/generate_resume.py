#!/usr/bin/env python3
"""
Generate Arjun's updated resume PDF with all projects from the portfolio + GitHub.

Updates in this version:
  - All contact info + project URLs are clickable hyperlinks (ReportLab <link> tags)
  - Portfolio is highlighted with a prominent callout box at the top of Key Projects
  - SDN Controller project added (legendary, networking)
  - Experience updated to Website Management & Marketing Head at AIOrders x Foodswipe
  - ATS-friendly single-column format
"""
import sys, os, shutil
sys.path.insert(0, '/home/z/my-project/skills/pdf/scripts')

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm, mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle, KeepTogether
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ── Font Registration ──
pdfmetrics.registerFont(TTFont('FreeSerif', '/usr/share/fonts/truetype/freefont/FreeSerif.ttf'))
pdfmetrics.registerFont(TTFont('FreeSerif-Bold', '/usr/share/fonts/truetype/freefont/FreeSerifBold.ttf'))
pdfmetrics.registerFont(TTFont('FreeSerif-Italic', '/usr/share/fonts/truetype/freefont/FreeSerifItalic.ttf'))
pdfmetrics.registerFont(TTFont('FreeSerif-BoldItalic', '/usr/share/fonts/truetype/freefont/FreeSerifBoldItalic.ttf'))
registerFontFamily('FreeSerif', normal='FreeSerif', bold='FreeSerif-Bold', italic='FreeSerif-Italic', boldItalic='FreeSerif-BoldItalic')

# ── Colors ──
ACCENT = colors.HexColor('#1a1a2e')          # Dark navy for headings
TEXT_MUTED = colors.HexColor('#555555')       # Muted gray for meta text
TEXT_BODY = colors.HexColor('#222222')        # Near-black for body
LINK_COLOR = colors.HexColor('#1a5276')       # Dark blue for hyperlinks (ATS-safe)
PORTFOLIO_BG = colors.HexColor('#f4f0e8')     # Warm cream for portfolio callout
PORTFOLIO_BORDER = colors.HexColor('#8b6914') # Gold border for portfolio callout

# ── Styles ──
name_style = ParagraphStyle(
    'ResumeName', fontName='FreeSerif-Bold', fontSize=22,
    leading=22, alignment=TA_CENTER, spaceAfter=2,
    textColor=ACCENT
)
title_style = ParagraphStyle(
    'ResumeTitle', fontName='FreeSerif', fontSize=11,
    leading=14, alignment=TA_CENTER, spaceAfter=2,
    textColor=TEXT_MUTED
)
contact_style = ParagraphStyle(
    'ResumeContact', fontName='FreeSerif', fontSize=9.5,
    leading=13, alignment=TA_CENTER, textColor=TEXT_MUTED,
    spaceAfter=6
)
section_title_style = ParagraphStyle(
    'ResumeSectionTitle', fontName='FreeSerif-Bold', fontSize=11,
    leading=13, spaceBefore=5, spaceAfter=2,
    textColor=ACCENT
)
job_title_style = ParagraphStyle(
    'ResumeJobTitle', fontName='FreeSerif-Bold', fontSize=10.5,
    leading=13, spaceAfter=1
)
job_meta_style = ParagraphStyle(
    'ResumeJobMeta', fontName='FreeSerif-Italic', fontSize=9.5,
    leading=12, textColor=TEXT_MUTED, spaceAfter=3
)
bullet_style = ParagraphStyle(
    'ResumeBullet', fontName='FreeSerif', fontSize=9,
    leading=11.5, leftIndent=14, bulletIndent=0,
    spaceBefore=0.3, spaceAfter=0.3
)
body_style = ParagraphStyle(
    'ResumeBody', fontName='FreeSerif', fontSize=9,
    leading=11.5, spaceAfter=1, alignment=TA_JUSTIFY
)
project_style = ParagraphStyle(
    'ResumeProject', fontName='FreeSerif-Bold', fontSize=9.5,
    leading=12, spaceBefore=2, spaceAfter=1
)
project_tech_style = ParagraphStyle(
    'ResumeProjectTech', fontName='FreeSerif-Italic', fontSize=8.5,
    leading=11, textColor=TEXT_MUTED, spaceAfter=1
)
portfolio_callout_style = ParagraphStyle(
    'ResumePortfolioCallout', fontName='FreeSerif', fontSize=10,
    leading=14, spaceAfter=2, alignment=TA_LEFT,
    textColor=TEXT_BODY
)
portfolio_link_style = ParagraphStyle(
    'ResumePortfolioLink', fontName='FreeSerif-Bold', fontSize=11,
    leading=14, alignment=TA_CENTER, spaceAfter=2,
    textColor=ACCENT
)

# ── Helpers ──
def section_header(title):
    return [
        Paragraph(f'<b>{title.upper()}</b>', section_title_style),
        HRFlowable(width='100%', thickness=0.8, color=ACCENT,
                    spaceBefore=0, spaceAfter=5),
    ]

def link(url, text, color=LINK_COLOR):
    """Build a ReportLab <link> tag with the given URL and display text."""
    return f'<link href="{url}" color="#{color.hexval()[2:]}"><u>{text}</u></link>'

def project_entry(name, desc, tech, link_url=None, link_text=None):
    """Build a project entry. If link_url is provided, the project name becomes a hyperlink."""
    elements = []
    if link_url:
        # Make the project name itself a clickable link
        elements.append(Paragraph(
            f'<b>{link(link_url, name)}</b>',
            project_style
        ))
    else:
        elements.append(Paragraph(f'<b>{name}</b>', project_style))
    elements.append(Paragraph(desc, body_style))
    elements.append(Paragraph(f'<i>Tech: {tech}</i>', project_tech_style))
    if link_url and link_text:
        elements.append(Paragraph(
            f'<i>Link: {link(link_url, link_text)}</i>',
            project_tech_style
        ))
    elements.append(Spacer(1, 2))
    return elements

# ── Build Document ──
output_path = '/home/z/my-project/download/Arjun_Vashishtha_Resume.pdf'
os.makedirs('/home/z/my-project/download', exist_ok=True)

doc = SimpleDocTemplate(
    output_path, pagesize=A4,
    leftMargin=1.5*cm, rightMargin=1.5*cm,
    topMargin=1.0*cm, bottomMargin=1.0*cm,
    title='Resume - Arjun Vashishtha',
    author='Arjun Vashishtha', creator='Arjun Vashishtha'
)

story = []

# ── Header (with clickable hyperlinks) ──
story.append(Paragraph('<b>ARJUN VASHISHTHA</b>', name_style))
story.append(Paragraph('Full-Stack Developer &bull; AI Builder &bull; Data Science &bull; SDN Engineer', title_style))

# Contact line — all links clickable
PORTFOLIO_URL = 'https://arjunv.is-a.dev'
GITHUB_URL = 'https://github.com/arjundroid12'
EMAIL_URL = 'mailto:arjunvashishtha2004@gmail.com'
PHONE_URL = 'tel:+919105459616'

contact_html = (
    f'{link(PHONE_URL, "+91 9105459616")} &nbsp;|&nbsp; '
    f'{link(EMAIL_URL, "arjunvashishtha2004@gmail.com")} &nbsp;|&nbsp; '
    f'Bhopal, India &nbsp;|&nbsp; '
    f'{link(GITHUB_URL, "github.com/arjundroid12")} &nbsp;|&nbsp; '
    f'{link(PORTFOLIO_URL, "arjunv.is-a.dev")}'
)
story.append(Paragraph(contact_html, contact_style))

# ── Summary ──
story.extend(section_header('Professional Summary'))
story.append(Paragraph(
    'Fourth-year B.Tech CSE student at VIT Bhopal, currently leading Website Management &amp; Marketing at '
    'AIOrders &times; Foodswipe. Bridges product, data, and growth — managing websites across two brands, '
    'coordinating software delivery, and driving marketing through UGC content and paid social campaigns. '
    'Strong foundation in Python, machine learning, and data analytics, with hands-on experience building '
    'autonomous AI agents, full-stack web applications, SDN controllers, and data-driven solutions. '
    f'Passionate about shipping practical products that solve real problems. '
    f'Live portfolio: {link(PORTFOLIO_URL, "arjunv.is-a.dev")}.',
    body_style
))

# ── Experience ──
story.extend(section_header('Experience'))
story.append(Paragraph('<b>Website Management &amp; Marketing Head</b>', job_title_style))
story.append(Paragraph('AIOrders &times; Foodswipe &nbsp;|&nbsp; Nov 2025 – Present &nbsp;|&nbsp; Remote', job_meta_style))
story.append(Paragraph('• <i>Leading website management and marketing across both AIOrders and Foodswipe brands.</i>', bullet_style))
story.append(Paragraph('• Manage website updates, performance tuning, and content drops for AIOrders and Foodswipe.', bullet_style))
story.append(Paragraph('• Run marketing campaigns across Instagram, Facebook, and Google Ads; create UGC content and edit video.', bullet_style))
story.append(Paragraph('• Coordinate software delivery timelines and cross-functional comms between dev and growth teams.', bullet_style))

# ── Portfolio link (compact one-liner instead of big callout box) ──
portfolio_link_html = '<b>' + link(PORTFOLIO_URL, 'Portfolio: arjunv.is-a.dev') + '</b> — dual-version interactive portfolio (dungeon RPG + terminal) with Next.js 16, Framer Motion, Web Audio API, 167 Goddess dialog lines, King boss fight, achievement system, and playable Snake game.'
story.append(Paragraph(portfolio_link_html, body_style))
story.append(Spacer(1, 3))

story.append(Paragraph(
    '15+ projects built across AI products, computer vision, networking, full-stack, frontend, and backend. '
    'Selected highlights below — see all projects with live demos at '
    + link(PORTFOLIO_URL, 'arjunv.is-a.dev') + '.',
    body_style
))

# ── Top 3 Projects only (one page) ──

story.extend(project_entry(
    'QUIRK — AI Toolkit for Content Creators',
    'AI-powered toolkit with three features: Script Studio (AI script generation with platform presets + inline editing), '
    'Idea Engine (4-10 personalized content ideas per batch with niche/platform/tone controls + idea bank), and '
    'Thumbnail Tester (AI vision scores on composition/emotion/CTR, picks winner). Next.js 16, Tailwind CSS 4, '
    'shadcn/ui, magic-link auth, Turso DB, Z.AI GLM-4.5-flash + Groq Llama 4 Scout. Live on Vercel.',
    'Next.js 16, TypeScript, Tailwind CSS 4, shadcn/ui, Turso, Z.AI GLM-4.5, Groq Llama 4, Vercel',
    'https://quirk-ten.vercel.app',
    'quirk-ten.vercel.app'
))

story.extend(project_entry(
    'SDN Controller — Ryu + P4 + DDoS Detection',
    'Custom SDN controller on Ryu + OpenFlow 1.3 with P4-16 data plane. LLDP topology discovery, reactive L2 '
    'forwarding with BFS shortest-path, real-time DDoS detector (threshold + entropy) with auto ACL drops. '
    'Flask REST API (16 endpoints), D3.js dashboard, sdnctl CLI, 66-test pytest suite, GitHub Actions CI.',
    'Python, Ryu, P4-16, OpenFlow 1.3, Mininet, Flask, D3.js, pytest, GitHub Actions',
    'https://github.com/arjundroid12/sdn-project',
    'github.com/arjundroid12/sdn-project'
))

story.extend(project_entry(
    'SpellCaster — Gesture-Controlled Spellcasting',
    'Gesture-controlled spellcasting web app. MediaPipe Hands detects 21 landmarks per hand, gesture classifier '
    'smooths jitter, spells fire from fingertips with neon particle FX + Web Audio synth sounds. Six spells, '
    'cooldowns, combo counter. Pure vanilla JS, no deps. Live demo on GitHub Pages.',
    'MediaPipe Hands, Web Audio API, Canvas 2D, Vanilla JS, GitHub Pages',
    'https://spellcaster.vercel.app',
    'arjundroid12.github.io/spellcaster'
))

# Highlighted line — see all projects at portfolio
story.append(Spacer(1, 3))
see_more_html = '<b><font color="#8b6914">' + link(PORTFOLIO_URL, 'See all 15+ projects with live demos at arjunv.is-a.dev') + '</font></b>'
story.append(Paragraph(
    see_more_html,
    ParagraphStyle('SeeMore', fontName='FreeSerif-Bold', fontSize=10, leading=13, alignment=1, textColor=colors.HexColor('#8b6914'))
))
story.append(Spacer(1, 4))

# ── Core Skills ──
story.extend(section_header('Core Skills'))
story.append(Paragraph('<b>AI/ML:</b> &nbsp;Python (Pandas, NumPy, scikit-learn), CNN, Random Forest, NLP, MediaPipe Hands, ReAct Pattern, Multi-Agent Systems, LLM integration', body_style))
story.append(Paragraph('<b>Web &amp; Networking:</b> &nbsp;JavaScript, TypeScript, React, Next.js 16, Node.js, Express, Tailwind CSS, Framer Motion, SDN (Ryu, P4, OpenFlow), Flask', body_style))
story.append(Paragraph('<b>Data &amp; Tools:</b> &nbsp;Power BI, MySQL, Git, GitHub Actions, Vercel, Cloudflare Pages, Turso, Three.js, Web Audio API', body_style))
story.append(Paragraph('<b>Product &amp; Marketing:</b> &nbsp;Website management, project coordination, UGC content, social media ads (Instagram, Facebook, Google Ads), video editing', body_style))

# ── Education ──
story.extend(section_header('Education'))
story.append(Paragraph('<b>B.Tech in Computer Science &amp; Engineering</b>', job_title_style))
story.append(Paragraph('VIT Bhopal University, Bhopal &nbsp;|&nbsp; 2022 – 2026 &nbsp;|&nbsp; Fourth Year (Undergraduate)', job_meta_style))

# ── Interests ──
story.extend(section_header('Interests'))
story.append(Paragraph(
    'Music (vocalist &amp; guitarist), videography, content creation, social media, and game development. '
    'Active GitHub contributor with daily coding challenges auto-committed via GitHub Actions.',
    body_style
))

# ── Build ──
doc.build(story)
print(f"Resume generated: {output_path}")
print(f"File size: {os.path.getsize(output_path)} bytes")

# Also copy to public/resume.pdf so the portfolio's Resume button serves the latest version
public_path = '/home/z/my-project/public/resume.pdf'
shutil.copy2(output_path, public_path)
print(f"Also copied to: {public_path}")
