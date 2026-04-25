# Soil Analyzer 🌍🌾

Soil Analyzer is a web-based application designed to help farmers and gardeners analyze soil quality and get personalized crop recommendations.

## Features
- **Soil Analysis**: Input N, P, K, and pH levels to receive detailed recommendations.
- **TerraBot AI**: An intelligent agricultural assistant to answer your farming queries.
- **Social Login**: Secure authentication via Google and Facebook.
- **Scan History**: Keep track of your previous soil analyses.

## Tech Stack
- **Backend**: Node.js, Express
- **Database**: MongoDB (Mongoose)
- **AI**: OpenRouter (Llama 3.1)
- **Frontend**: HTML, CSS, JavaScript (Vanilla)

## Deployment
This project is configured for easy deployment on **Vercel** or **Render**.
- **Vercel**: Use the provided `vercel.json`.
- **Render**: Connect your GitHub repository and it will automatically detect the `start` script.

## Environment Variables
Ensure the following variables are set in your deployment environment:
- `MONGODB_URI`
- `OPENROUTER_API_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `FACEBOOK_APP_ID`
- `FACEBOOK_APP_SECRET`
- `SESSION_SECRET`
