# 🚀 Visual Studio Code Extension Publishing Guide

This guide walks you through the step-by-step process of publishing **Antigravity for Copilot** to the official Visual Studio Code Marketplace under your own account.

---

## 📋 Prerequisites

Before publishing, you need three accounts set up:
1. **Microsoft Account**: Needed to manage your publisher profile.
2. **Azure DevOps Organization**: Used to generate the Personal Access Token (PAT) required for secure command-line publishing.
3. **Visual Studio Marketplace Publisher Account**: The public profile that hosts your extension.

---

## 🛠️ Step 1: Create a Personal Access Token (PAT)

VS Code extensions are published securely from your command line using a Personal Access Token (PAT) from Azure DevOps.

1. Go to [Azure DevOps (dev.azure.com)](https://dev.azure.com) and sign in.
2. If you don't have an organization, click **Create New Organization** (choose any name and select a region).
3. Inside your organization home, click the **User Settings** icon (next to your avatar in the top-right corner) and select **Personal Access Tokens**.
4. Click **New Token**:
   - **Name**: `vsce-publishing`
   - **Organization**: Select **All accessible organizations** (Crucial!).
   - **Expiration**: Set to **Custom defined** (maximum allowed is 1 year) or standard 30/90 days.
   - **Scopes**: Click **Show all scopes** at the bottom, scroll down to find **Marketplace**, and select **Acquire** & **Manage**.
5. Click **Create** and **COPY the PAT immediately** (you will not be able to see it again!).

---

## 👤 Step 2: Register your Publisher Name

The publisher is your unique ID on the Visual Studio Marketplace (for example, `akshar-bhesaniya`).

1. Go to the [Visual Studio Marketplace Publisher Management Portal](https://marketplace.visualstudio.com/manage).
2. Sign in using your Microsoft account.
3. Create a **New Publisher**:
   - **ID**: `akshar-bhesaniya` (Must match the exact `"publisher"` ID in your `package.json`!)
   - **Display Name**: `Akshar Bhesaniya`
   - Fill in your website or email (optional).
4. Save the profile.

---

## 📦 Step 3: Match the IDs in `package.json`

Before building the final package, ensure the `"publisher"` ID inside your project's [`package.json`](package.json) matches the publisher ID you just created in the Marketplace portal:

```json
{
  "name": "antigravity-copilot",
  "displayName": "Antigravity for Copilot",
  "version": "1.0.0",
  "publisher": "akshar-bhesaniya",
  "author": "akshar-bhesaniya"
}
```

---

## 🚀 Step 4: Publish Your Extension

You can publish either **directly through the command line** (recommended for speed) or **via the Web Dashboard**.

### Method A: Publishing via Command Line (Recommended)

1. Open your terminal in the root folder of the project (`c:\Demo\antigravity-copilot`).
2. Login to your publisher using the `vsce` CLI (it will prompt you for your copied Azure DevOps PAT):
   ```bash
   npx @vscode/vsce login akshar-bhesaniya
   ```
3. Run the publishing command. This automatically compiles, packages, and uploads your VSIX to the Marketplace:
   ```bash
   npm run compile
   npx @vscode/vsce publish
   ```

---

### Method B: Publishing via Web UI Upload

If you prefer not to use PATs in the terminal, you can upload the packaged `.vsix` file manually:

1. Package the extension to generate the `.vsix` file locally:
   ```bash
   npm run package
   ```
   This outputs the `antigravity-copilot-1.0.0.vsix` file in your root folder.
2. Go to the [Marketplace Management Portal](https://marketplace.visualstudio.com/manage).
3. Select your publisher profile (`akshar-bhesaniya`).
4. Click **New Extension** → **Visual Studio Code**.
5. Drag and drop the generated `antigravity-copilot-1.0.0.vsix` file and click **Upload**.

---

## 🔄 Step 5: Updating Your Extension (Subsequent Releases)

When you make changes and want to release a new version (e.g., `1.0.1`), you can increment the version and publish with a single command:

```bash
# To increment the patch version (e.g., 1.0.0 -> 1.0.1) and publish
npx @vscode/vsce publish patch

# To increment the minor version (e.g., 1.0.0 -> 1.1.0) and publish
npx @vscode/vsce publish minor
```
The command automatically updates `package.json` versioning, runs compile tasks, and uploads the new version!

---

## 💡 Pro Tips for Marketplace Success

- **Visual Quality**: Make sure your modern logo (`media/icon.png`) is crisp and looks great in both light and dark themes.
- **Search Engine Optimization (SEO)**: We added precise tags like `claude`, `gemini`, and `copilot` to your `package.json`. These will help your extension appear when users search for model integration or BYOK custom endpoints.
- **Preview on Marketplace**: Once uploaded, your extension goes through a **Verification** phase (usually taking 1 to 5 minutes) before becoming public. You can check its preview state directly in your Marketplace Portal!
