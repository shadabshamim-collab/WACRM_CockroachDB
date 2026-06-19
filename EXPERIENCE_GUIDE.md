# 🚀 WACRM Experience Guide — Complete Setup & Demo

This guide walks you through setting up and experiencing WACRM locally, from installation to exploring all core features.

---

## Part 1: Initial Setup (5 minutes)

### Step 1.1: Clone the Repository

```bash
# Clone the WACRM_CockroachDB repository
git clone https://github.com/shadabshamim-collab/WACRM_CockroachDB.git
cd WACRM_CockroachDB

# Install dependencies
npm install
```

### Step 1.2: Configure Environment Variables

```bash
# Copy the example environment file
cp .env.local.example .env.local

# Edit .env.local with your configuration
# Required variables (already filled in for local dev):
# - DATABASE_URL: CockroachDB connection string
# - JWT_SECRET: Authentication key
# - ENCRYPTION_KEY: WhatsApp token encryption
# - META_APP_SECRET: WhatsApp webhook verification
```

**For Local Testing**: The `.env.local` file already has valid CockroachDB credentials pointing to the demo database.

### Step 1.3: Start the Development Server

```bash
npm run dev
```

You'll see output like:
```
▲ Next.js 16.2.6 (Turbopack)
- Local:         http://localhost:3000
- Network:       http://192.168.0.104:3000
```

**Open http://localhost:3000 in your browser** → You'll be redirected to the login page.

---

## Part 2: Authentication (2 minutes)

### Step 2.1: Create an Account

Since this is a fresh database, you'll need to create an account first.

1. **Go to**: http://localhost:3000/signup
2. **Fill in**:
   - Email: `admin@example.com` (or any email)
   - Password: `SecurePassword123!` (at least 8 characters)
3. **Click "Sign Up"**

The system will:
- Create your user profile
- Create your account (team/organization)
- Set you as the owner
- Redirect you to the dashboard

### Step 2.2: Login

After signup, you're automatically logged in. To test the login flow:

1. **Go to**: http://localhost:3000/login
2. **Enter**: Your email and password from Step 2.1
3. **Click "Sign In"** → Redirects to dashboard

---

## Part 3: Dashboard Tour (3 minutes)

### What You'll See

The **Dashboard** is your command center:

**Left Sidebar Navigation**:
- 📊 **Dashboard** — Overview & analytics
- 💬 **Inbox** — Conversations & messages
- 📇 **Contacts** — Customer database
- 📈 **Pipelines** — Sales stages (Kanban)
- 📢 **Broadcasts** — Campaign management
- ⚙️ **Automations** — Workflow builder
- ⚡ **Flows** — Advanced automations
- ⚙️ **Settings** — Account & user management

**Top Right**:
- 👤 User menu (profile, settings, logout)
- 🎨 Theme selector (Violet, Emerald, Cobalt, Amber, Rose)

### Step 3.1: View Dashboard Stats

Click **Dashboard** in the sidebar. You'll see:
- 📱 Daily message volume
- ⏱️ Average response time
- 💰 Pipeline value
- 📊 Activity feed (contacts added, conversations started, etc.)

Since this is a fresh database, these will show 0 or empty states. That's expected!

---

## Part 4: Create Test Data (5 minutes)

### Step 4.1: Add a Contact

1. **Go to**: Sidebar → **Contacts**
2. **Click**: "+ New Contact" button
3. **Fill in**:
   - Name: `John Doe`
   - Phone: `+1234567890` (WhatsApp number format)
   - Tags: Add `potential-customer` (create new tag)
   - Custom Fields: Add any extra info
4. **Click "Save"**

**Result**: Contact appears in the contacts list. You can click to view/edit profile.

### Step 4.2: Create a Sales Pipeline

1. **Go to**: Sidebar → **Pipelines**
2. **Click**: "+ New Pipeline" button
3. **Name it**: `Q3 Sales Pipeline`
4. **Add Stages**:
   - Lead
   - Qualified
   - Proposal
   - Negotiation
   - Won
   - Lost
5. **Click "Create"**

### Step 4.3: Add a Deal to Pipeline

1. **In Pipelines**, click your newly created pipeline
2. **Drag from "Lead" stage** → "+ Add Deal"
3. **Fill in**:
   - Title: `Deal with John Doe`
   - Contact: Select `John Doe` (from Step 4.1)
   - Value: `$5,000`
   - Currency: `USD`
4. **Click "Create"**

**Result**: A card appears in the "Lead" stage. Drag it between stages to move deals through your pipeline.

---

## Part 5: Explore Core Features (10 minutes)

### Feature 1: Contacts Management

**Path**: Sidebar → **Contacts**

**What You Can Do**:
- ✅ **Search** — Find contacts by name, email, or phone
- ✅ **Filter** — By tags, custom fields, or creation date
- ✅ **Import** — Upload CSV with bulk contacts
- ✅ **Export** — Download contact list
- ✅ **Custom Fields** — Add WhatsApp-specific or industry fields
- ✅ **Tags** — Organize and segment contacts

**Try This**:
1. Click on "John Doe" contact you created
2. View their profile (phone, name, tags, custom fields)
3. Add a note: `"Follow up on Thursday"`
4. Click "Save"

### Feature 2: Broadcasts (Campaigns)

**Path**: Sidebar → **Broadcasts**

**What You Can Do**:
- ✅ **Template Selection** — Choose from Meta-approved WhatsApp templates
- ✅ **Audience** — Select contacts or segments to send to
- ✅ **Personalization** — Add {{first_name}}, {{custom_field}}, etc.
- ✅ **Schedule** — Send now or schedule for later
- ✅ **Track Results** — Monitor delivery, reads, engagement

**Try This**:
1. **Click**: "+ New Broadcast"
2. **Step 1 - Template**: Select a simple template (or skip if none available)
3. **Step 2 - Audience**: Select "John Doe" contact
4. **Step 3 - Personalize**: Add message text
5. **Step 4 - Review**: Check preview
6. **Note**: In test mode, won't actually send to WhatsApp

### Feature 3: Automations (No-Code Workflows)

**Path**: Sidebar → **Automations**

**What You Can Do**:
- ✅ **Visual Builder** — Drag-and-drop workflow design
- ✅ **Triggers**: Inbound message, new contact, keyword match, schedule
- ✅ **Actions**: Send message, add tag, create deal, call webhook
- ✅ **Conditions**: Branch logic (if/else)
- ✅ **Delays**: Wait X hours before next action

**Try This**:
1. **Click**: "+ New Automation"
2. **Name it**: `Welcome New Contacts`
3. **Set Trigger**: "New Contact Added"
4. **Add Action**: "Send Message" → Select template
5. **Add Action**: "Add Tag" → `welcomed`
6. **Click "Save"**
7. **Click "Activate"** to enable it

**Result**: Whenever you add a new contact, this automation runs automatically.

### Feature 4: Flows (Advanced Automations)

**Path**: Sidebar → **Flows**

**What You Can Do**:
- ✅ **Advanced Builder** — Complex, node-based workflow design
- ✅ **State Machine** — Track conversation state
- ✅ **Interactive Messages** — Button replies, list selections
- ✅ **Real-Time Responses** — React to each message
- ✅ **Variables** — Store and use data across steps

**Try This**:
1. **Click**: "+ New Flow"
2. **Name it**: `Customer Support Bot`
3. **Set Start**: "Message Received"
4. **Add Node**: "Send Message" → `"Hi! How can we help?"`
5. **Add Node**: "Wait for Reply"
6. **Add Node**: "Send to Agent" (tag as support_pending)
7. **Save & Publish**

---

## Part 6: Settings & Team Management (3 minutes)

### Step 6.1: Access Account Settings

**Path**: Bottom left corner → Avatar → **Settings**

**Available Sections**:

1. **Profile**
   - Update name, email, avatar
   - Change password
   - Delete account

2. **Team Members**
   - View current team members
   - Invite new members via link
   - Set roles (owner, admin, agent, viewer)
   - Remove members

3. **Sessions**
   - View active login sessions
   - Sign out from other devices
   - Track login history

4. **Custom Fields**
   - Define fields for contacts
   - Types: text, number, date, dropdown, etc.
   - Use in automations and reports

5. **Tags**
   - Create and manage tags
   - Assign colors
   - Use to organize contacts

6. **WhatsApp Configuration**
   - Test connection to Meta API
   - View phone number status
   - Manage templates

### Step 6.2: Invite a Team Member

1. **Go to**: Settings → **Team Members**
2. **Click**: "+ Invite Member"
3. **Select Role**:
   - 👑 **Owner** — Full access, can transfer ownership
   - 🔑 **Admin** — Full access, manage team
   - 👤 **Agent** — Can send messages, manage conversations
   - 👁️ **Viewer** — Read-only access
4. **Copy Link** → Share with teammate
5. **Teammate clicks link** → Creates account → Joins your team

---

## Part 7: Testing Real WhatsApp Integration (5 minutes)

> **Note**: This requires a real Meta Business Account and WhatsApp Business API access.

### Prerequisites
- Meta Business Account (https://business.facebook.com)
- WhatsApp Business API access
- Webhook URL (your deployed WACRM URL)
- Meta App credentials

### Setup Steps

1. **Go to Settings → WhatsApp Configuration**
2. **Connect WhatsApp**:
   - Phone Number ID
   - Access Token
   - Verification Token
   - App Secret

3. **Verify Webhook**:
   - Set webhook URL in Meta dashboard
   - Verification token matches above
   - WACRM automatically handles verification

4. **Test Connection**:
   - Click "Test Connection" button
   - Should see ✅ "Connection Successful"

5. **Send Messages**:
   - InboundMessages appear in **Inbox** → **Conversations**
   - Reply directly from the CRM
   - Messages sent via official WhatsApp Business API

---

## Part 8: Database Verification (2 minutes)

### Check CockroachDB Connection

```bash
# Test database connection
npm run db:test

# Expected output:
# ✅ Database connection working
# ✅ All 27 tables exist
# ✅ CRUD operations verified
```

Or use the provided test script:

```bash
set -a && source .env.local && set +a && npx tsx test-e2e.ts
```

---

## Part 9: Development Tips

### Hot Reloading

Changes to files automatically reload in the browser (Turbopack is fast!):
- Edit a component → Saves → Browser updates instantly
- Edit a page → Redirects automatically
- Edit styles → Refreshes without full reload

### Type Safety

Get immediate TypeScript errors:
```bash
npx tsc --noEmit
```

### Build for Production

```bash
npm run build

# Then run:
npm run start
```

### View Logs

Development logs appear in the terminal:
```
GET /api/contacts 200 in 45ms
POST /api/automations/[id]/activate 201 in 123ms
```

---

## Part 10: What You've Experienced

By completing this guide, you've:

✅ **Setup** — Cloned, installed, configured the project  
✅ **Authentication** — Created account, logged in  
✅ **Dashboard** — Viewed analytics and activity  
✅ **Contacts** — Added and managed customer profiles  
✅ **Pipelines** — Created sales stages and deals  
✅ **Broadcasts** — Set up campaigns  
✅ **Automations** — Built no-code workflows  
✅ **Flows** — Created advanced conversation flows  
✅ **Settings** — Configured account and team  
✅ **Database** — Verified CockroachDB connection  

---

## Troubleshooting

### Issue: "Cannot find module '@/lib/...'

→ Run `npm install` again

### Issue: Database connection error

→ Check `.env.local` has valid `DATABASE_URL`  
→ Verify CockroachDB cluster is accessible

### Issue: WhatsApp features not working

→ WhatsApp integration requires real Meta credentials  
→ Use test data otherwise

### Issue: Port 3000 already in use

```bash
# Use different port
PORT=3001 npm run dev
```

---

## Next Steps

### For Customization
1. Fork the repository
2. Modify colors, logo, branding in styles
3. Add custom fields for your industry
4. Extend automations for your workflows
5. Deploy to Hostinger or your own server

### For Integration
1. Set up real WhatsApp Business account
2. Configure Meta App credentials
3. Point webhook to your deployed instance
4. Connect CRM to your WhatsApp number

### For Team Scaling
1. Invite team members
2. Set roles and permissions
3. Create automations for consistency
4. Monitor activity feeds

### For Production
1. Use CockroachDB Cloud (managed)
2. Deploy app to Hostinger, Vercel, or self-hosted
3. Set up monitoring and backups
4. Configure custom domain + SSL

---

## Key Features Summary

| Feature | What It Does | Use Case |
|---------|------------|----------|
| **Inbox** | Centralized conversation management | Team collaboration on customer messages |
| **Contacts** | Customer database with custom fields | CRM & segmentation |
| **Pipelines** | Sales stage tracking (Kanban) | Deal tracking & sales management |
| **Broadcasts** | Template-based campaigns | Marketing & re-engagement |
| **Automations** | Simplified workflow builder | Common tasks (welcome, tags, etc.) |
| **Flows** | Advanced conversation logic | Customer service bots, lead qualification |
| **Dashboard** | Real-time metrics & activity | Team visibility & KPIs |
| **Settings** | Account, team, WhatsApp config | Administration & customization |

---

## Support & Documentation

- **Full Docs**: https://wacrm.tech/docs
- **Migration Guide**: See `SUPABASE_TO_COCKROACH_MIGRATION.md`
- **Database Report**: See `COCKROACHDB_CONNECTION_TEST_REPORT.md`
- **GitHub**: https://github.com/shadabshamim-collab/WACRM_CockroachDB

---

**Congratulations!** You've experienced WACRM in action. This is your CRM — customize it, deploy it, own it. 🚀
