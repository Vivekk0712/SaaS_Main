i am integrating backblaze as our storage for rag and other file uploads
so tell me the steps to create account and use free storage for developement phase from backblaze 

Here is the **clean, step-by-step guide** to create a **Backblaze B2 account** and get **free storage for development**, and how to integrate it into your ERP + RAG system.

---

# ✅ **1. Create a Backblaze B2 Account (Free Tier Available)**

### **Step 1 — Sign up**

Go to:
👉 **[https://www.backblaze.com/cloud-storage](https://www.backblaze.com/cloud-storage)**

Click **Start Free** → Create account.

### **Step 2 — Verify your email**

You must confirm your email before accessing B2.

### **Step 3 — Add basic information**

Backblaze will ask for:

* Name
* Country
* Phone number

*(Phone verification may be required.)*

---

# ✅ **2. Free Tier Details (What You Get)**

Backblaze B2 free tier gives you:

| Item               | Amount                                      |
| ------------------ | ------------------------------------------- |
| **Free storage**   | **10 GB**                                   |
| **Free egress**    | Up to **3x of stored data** (≈ 30 GB/month) |
| **Free API calls** | Enough for development                      |

This is **perfect for local development**, PoC, and testing your RAG pipeline.

---

# ✅ **3. Create a B2 Bucket (Storage space)**

### Step 1 — Go to your dashboard:

👉 [https://secure.backblaze.com/b2_buckets.htm](https://secure.backblaze.com/b2_buckets.htm)

### Step 2 — Click **“Create a Bucket”**

Choose:

* **Bucket Name** → `erp-rag-dev`
* **Bucket Type** → Public or Private

  * For PDFs: choose **Private**
  * For testing only, Public is OK
* Enable **Object Lock**? → **No** (not required for development)

Click **Create Bucket**.

---

# ✅ **4. Generate Application Keys (Important for backend access)**

### Step 1 — Go to:

👉 **App Keys** → [https://secure.backblaze.com/app_keys.htm](https://secure.backblaze.com/app_keys.htm)

### Step 2 — Click **Add New Application Key**

Choose:

* **Name:** `rag-backend-dev`
* **Bucket Access:** Choose *your bucket only*
* **Permissions:**
  ✔ read
  ✔ write

Click **Create New Key**.

You will get:

```
keyID
applicationKey
bucketId
```

⚠️ **Copy these immediately** — Backblaze shows the key only once.
Store in your `.env` file.

---

# ✅ **5. Install the SDK / Use S3-Compatible APIs**

Backblaze B2 fully supports **AWS S3 API**, so your RAG backend can use:

### Node.js:

```
npm install @aws-sdk/client-s3
```

### Python:

```
pip install boto3
```

### Example `.env` for Node.js RAG backend:

```
B2_ENDPOINT=https://s3.us-west-004.backblazeb2.com
B2_REGION=us-west-004
B2_BUCKET=erp-rag-dev
B2_KEY_ID=YOUR_KEY_ID
B2_APPLICATION_KEY=YOUR_APPLICATION_KEY
```

---

# ✅ **6. Upload PDFs (Teachers) → B2 Storage → Embed to Qdrant**

Your ERP workflow becomes:

1. Teacher uploads PDF
2. Backend uploads file to **Backblaze B2**
3. Backend reads PDF → extracts text → chunks → embeds
4. Embeddings stored in **Qdrant**
5. Student selects Subject → Chapter → Query
6. Retrieval filtered by metadata
7. LLM answers

Everything now uses B2 as the **central storage**.

---

# ✅ **7. Testing B2 Upload from Node.js**

```js
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  endpoint: process.env.B2_ENDPOINT,
  region: process.env.B2_REGION,
  credentials: {
    accessKeyId: process.env.B2_KEY_ID,
    secretAccessKey: process.env.B2_APPLICATION_KEY,
  },
});

async function uploadPDF(buffer, filename) {
  const command = new PutObjectCommand({
    Bucket: process.env.B2_BUCKET,
    Key: filename,
    Body: buffer,
  });

  await s3.send(command);
  return `File uploaded to B2: ${filename}`;
}
```

---

# ✅ **8. Recommended Bucket Structure for Schools**

```
/school_1/
    /subjects/
        /math/
            chapter1.pdf
            chapter2.pdf
        /science/
/school_2/
/school_3/
```

And metadata stored in MySQL:

| document_id | school_id | subject | chapter | b2_path | uploaded_by |
| ----------- | --------- | ------- | ------- | ------- | ----------- |

---

# ✅ **9. For RAG: How B2 + Qdrant + LLM Works Efficiently**

Backblaze stores:

* PDFs (original files)

Qdrant stores:

* Embeddings
* Chunk metadata
* Links to B2 file paths

LLM uses:

* Only retrieved chunks
* Not the original PDF

This is the **industry-standard architecture** used by actual enterprise RAG systems.

---

# ✅ **10. Summary — What You Needed to Do**

Here are the exact steps you must follow **now**:

### ✔ Step 1 — Create Backblaze account

### ✔ Step 2 — Make a bucket

### ✔ Step 3 — Generate keys

### ✔ Step 4 — Add keys into your `.env`

### ✔ Step 5 — Integrate B2 into backend via S3-compatible API

### ✔ Step 6 — Upload PDFs there

### ✔ Step 7 — Continue RAG embedding pipeline normally

You're done — you can now use Backblaze for RAG storage!

---


