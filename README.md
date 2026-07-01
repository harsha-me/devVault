# DevVault 🚀

**DevVault** is a modern, unified workspace built specifically for developers. It combines secure note-taking, a code snippet repository, an in-app multi-language compiler, calendar management, and team collaboration into a single, beautiful dashboard. 

---

## 🌟 Key Features

### 1. 📝 Developer Notes & Code Snippet Vault
* Store markdown notes, snippets, and documentation.
* Pin important notes for quick access.
* Add tags and search notes instantaneously.
* Automatic schema adjustment to store massive codeblocks and logs (`LONGTEXT` support).

### 2. 💻 Integrated Code Compiler
* Write, test, and run code directly in your browser.
* Supports multiple programming languages.
* Fast, lightweight in-app code execution console.

### 3. 👥 Collaborative Note Sharing
* Share your notes and code snippets with other developers via email.
* Shared notes section for incoming collaboration.

### 4. 📅 Developer Calendar & Tasks
* Schedule deadlines, set coding task reminders, and track milestones.
* Unified view of your upcoming schedule.

### 5. 📊 Premium Activity Dashboard & Profile
* Tracks total notes, shared items, and reminders.
* Calculates a personal **Productivity Score** dynamically.
* Beautiful user profiles with avatar support, member-since metrics, and account actions.

---

## 🛠️ Technology Stack

### Frontend
* **Core:** React.js, JavaScript (ES6+)
* **Styling:** Custom modern CSS, glassmorphism, responsive grids
* **Libraries:** React Router, React Markdown (with syntax highlighters)

### Backend
* **Core:** Spring Boot, Java 17
* **Database Integration:** Spring Data JPA, Hibernate ORM
* **Security:** Spring Security (password hashing, stateless configurations)
* **Optimization:** Hikari Connection Pooling (warmed-up connections, keepalive pings)

### Database
* **Production:** Hosted MySQL (Aiven Cloud)

---

## 📂 Project Structure

```text
DevVault/
├── backend/                  # Spring Boot API Application
│   ├── src/main/java/        # Java source code
│   │   └── com/devvault/     # Entities, Controllers, Repositories, Configurations
│   └── src/main/resources/   # Application properties & configurations
├── frontend/                 # React SPA Client
│   ├── public/               # Static assets
│   └── src/                  # Components, Pages, Utilities, Stylesheets
└── README.md                 # Project Overview & Guide
```

---

## 🚀 Local Installation & Setup

### Prerequisites
* Java JDK 17 or higher installed.
* Node.js and npm installed.
* Maven installed (or use `./mvnw` wrapper).
* MySQL Database running locally.

### Setup Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Configure your MySQL database settings in `src/main/resources/application.properties`:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/devvault
   spring.datasource.username=YOUR_USERNAME
   spring.datasource.password=YOUR_PASSWORD
   ```
3. Run the application:
   ```bash
   ./mvnw spring-boot:run
   ```
   *The server runs locally on `http://localhost:8080`.*

### Setup Frontend
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure the local environment variable (`.env` file):
   ```env
   REACT_APP_API_BASE=http://localhost:8080
   ```
4. Start the React app:
   ```bash
   npm start
   ```
   *The development server opens on `http://localhost:3000`.*

---

## 🌐 Deployment Details
* **Frontend:** Hosted on **Vercel** (`dev-vault-theta.vercel.app`)
* **Backend:** Hosted on **Render** (`devvault-1-aeaj.onrender.com`)
* **Database:** Hosted on **Aiven Cloud MySQL**

---

## 🗺️ Future Roadmap (Upcoming Features)

We are constantly working to expand the capabilities of DevVault. Here are 5 major features planned for the future:

### 1. 🤖 AI Code Companion & Explainer
* Integrated AI assistant powered by Gemini API to explain complex code blocks, suggest optimizations, and find bugs in stored notes.
* Natural language code generation directly into the note editor.

### 2. ⚡ Live Multiplayer Code Collaboration (WebSockets)
* Real-time document and code editing with live cursor tracking, allowing multiple developers to collaborate on the same note or compile code simultaneously.
* High-speed WebSockets integration for instantaneous updates.

### 3. ⏱️ Note Version Control & History
* Commit-history style tracking for snippets and notes.
* View changes over time, trace diffs, and rollback notes to earlier versions.

### 4. 📴 Offline-First Mode with Background Sync
* Save, edit, and run code offline using IndexedDB local storage.
* Auto-syncing background workers that update your cloud database (Aiven) as soon as internet connection is restored.

### 5. 🌐 API Sandbox & Endpoint Tester
* Built-in HTTP client (similar to Postman) to construct, test, and run API requests directly from the app.
* Seamlessly store API request configurations and JSON payloads as executable documentation.

