# Commentify 🚀

**AI-powered code documentation made effortless!**

Transform your code documentation workflow with intelligent JSDoc and inline comment generation powered by Groq AI. Say goodbye to tedious manual documentation and hello to professional, consistent comments in seconds.

![Commentify Demo](https://via.placeholder.com/600x300/007ACC/FFFFFF?text=Commentify+Demo)

## ✨ Features

- 🤖 **AI-Powered**: Leverages Groq's lightning-fast AI models
- 📝 **JSDoc Generation**: Complete function documentation with `@param`, `@returns`, `@throws`, and `@example`
- 💬 **Inline Comments**: Smart explanatory comments for any line of code
- ⚡ **Lightning Fast**: Instant comment generation with keyboard shortcuts
- 🎯 **Context-Aware**: Understands your code structure and generates relevant documentation
- 🔒 **Secure**: Your API key is stored securely in VS Code's secret storage

## 🚀 Quick Start

### 1. Install
Search for "Commentify" in VS Code Extensions or install from [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=danielmecoss.commentify)

### 2. Setup
1. Get your free API key from [Groq Console](https://console.groq.com/)
2. Open Command Palette (`Ctrl+Shift+P`)
3. Run "Set Groq API Key"
4. Paste your API key

### 3. Start Commenting!
- **`Ctrl+Shift+D`** - Generate JSDoc for functions
- **`Ctrl+Shift+C`** - Generate inline comments

## 📖 Usage Examples

### JSDoc Generation
Place your cursor inside any function and press `Ctrl+Shift+D`:

```javascript
// Before
async function createUser(userData, options) {
    // Your function code here
}

// After (Generated automatically)
/**
 * Creates a new user account with the provided user data and configuration options.
 * @param {Object} userData - The user information object containing personal details
 * @param {string} userData.name - The user's full name
 * @param {string} userData.email - The user's email address
 * @param {Object} options - Configuration options for user creation
 * @param {boolean} options.sendWelcomeEmail - Whether to send a welcome email
 * @returns {Promise<User>} A promise that resolves to the created user object
 * @throws {ValidationError} When user data validation fails
 * @throws {DatabaseError} When database operation fails
 * @example
 * const user = await createUser(
 *   { name: 'John Doe', email: 'john@example.com' },
 *   { sendWelcomeEmail: true }
 * );
 */
async function createUser(userData, options) {
    // Your function code here
}
```

### Inline Comments
Place your cursor on any line and press `Ctrl+Shift+C`:

```javascript
// Before
const hashedPassword = await bcrypt.hash(password, 10);

// After (Generated automatically)
// Hash the password using bcrypt with a salt rounds of 10 for security
const hashedPassword = await bcrypt.hash(password, 10);
```

## 🎯 Supported Languages

- JavaScript
- TypeScript
- And more coming soon!

## ⚙️ Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| Generate JSDoc Comment | `Ctrl+Shift+D` | Creates comprehensive JSDoc documentation for the current function |
| Generate Inline Comment | `Ctrl+Shift+C` | Generates explanatory comment for the current line |
| Set Groq API Key | - | Configure your Groq API key securely |
| Test Groq Connection | - | Verify your API connection is working |

## 🔧 Configuration

No additional configuration needed! Just set your API key and start generating comments.

## 🤝 Contributing

Found a bug or have a feature request? 
- 🐛 [Report Issues](https://github.com/kiskee/Commentify/issues)
- 💡 [Request Features](https://github.com/kiskee/Commentify/issues)
- 🔧 [Contribute Code](https://github.com/kiskee/Commentify/pulls)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Powered by [Groq AI](https://groq.com/) for ultra-fast inference
- Built with ❤️ for the developer community

---

**⭐ If Commentify saves you time, please consider giving it a star on [GitHub](https://github.com/kiskee/Commentify)!**