# ThreatLens 🔍
### Explainable Phishing & Digital Scam Risk Analyzer

ThreatLens is a cybersecurity prototype built for **TechTrix '26** to help users identify suspicious messages, phishing attempts, and potentially malicious URLs through explainable, rule-based analysis.

Instead of presenting only a risk score, ThreatLens aims to highlight suspicious signals and provide actionable safety recommendations so users can better understand *why* a message may be dangerous.

## 🎯 Problem Statement

Phishing messages and online scams often exploit urgency, impersonation, fake rewards, suspicious links, and requests for sensitive information. These warning signs can be easy to overlook, especially when a message appears convincing.

ThreatLens explores how a simple, accessible interface can help users recognize these patterns before interacting with suspicious content.

## ✨ Key Features

- **Risk assessment:** Produces a risk score and severity classification based on detected indicators.
- **Explainable findings:** Highlights suspicious patterns that contribute to the assessment.
- **URL and message analysis:** Helps examine potentially suspicious links and message content.
- **Safety recommendations:** Provides guidance based on the detected warning signs.
- **Analysis breakdown:** Organizes extracted information and detection results to make the assessment easier to understand.
- **Privacy-conscious design:** The intended analysis workflow processes submitted content locally in the browser rather than transmitting message content to a backend.

## ⚙️ How It Works

1. **Input:** The user submits suspicious message text or a URL for analysis.
2. **Normalization:** The input is prepared for consistent analysis.
3. **Detection:** Rule-based checks look for suspicious patterns and indicators.
4. **Risk assessment:** Detected indicators are used to estimate a risk level.
5. **Explanation:** The results present findings and recommended safety actions.

## 🛠️ Technology Stack

- **React** — User interface
- **TypeScript** — Type-safe application development
- **Vite** — Development server and production build tooling
- **Tailwind CSS** — Interface styling
- **Lucide React** — Icons

## 🚀 Run Locally

### Prerequisites

- Node.js
- npm

### Installation

Clone the repository:

```bash
git clone https://github.com/Vatafico/threatlens-techtrix26.git
cd threatlens-techtrix26
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL printed in your terminal.

### Production Build

To generate a production build:

```bash
npm run build
```

The compiled application is generated in the `dist` directory.

## 🔐 Security, Privacy & Limitations

ThreatLens is an experimental prototype, not a production-grade security product.

- Risk scores are heuristic estimates, not proof that a message is malicious or safe.
- The current prototype does not perform live threat-intelligence or domain-reputation verification.
- A low-risk result does not guarantee that a link or message is safe.
- Suspicious links should not be opened merely to test them.
- Do not submit real passwords, OTPs, financial details, or other sensitive information.
- Local processing is not a substitute for a security audit or independent verification.

Always verify unexpected requests through the organization's official website or a trusted contact channel.

## 🔮 Future Scope

Potential improvements include:

- Integration with reputable threat-intelligence services
- Stronger URL parsing and detection of lookalike domains
- Expanded regression testing and false-positive reduction
- Additional analysis for different phishing and social-engineering patterns
- Improved reporting and security-awareness resources

These are potential extensions, not claims about currently implemented functionality.

## 🏁 Project Information

**Event:** TechTrix '26 — Vibe Coding

**Project:** ThreatLens

**Category:** Cybersecurity

**Repository:** [github.com/Vatafico/threatlens-techtrix26](https://github.com/Vatafico/threatlens-techtrix26)

---

*Built as a cybersecurity prototype exploring explainable detection of phishing and digital scam indicators.*

