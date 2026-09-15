import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';
import Problem from './models/Problem.model';
dotenv.config();

const API_URL = "https://alfa-leetcode-api.onrender.com/select?titleSlug=";

async function run() {
  await mongoose.connect(process.env.MONGO_URI as string);
  console.log('Connected to MongoDB');

  const problems = await Problem.find({});
  console.log(`Found ${problems.length} problems to update`);

  let count = 0;
  for (const problem of problems) {
    if (problem.description && !problem.description.includes('This is the description for')) {
      // Skip already updated problems
      continue;
    }

    let success = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await axios.get(`${API_URL}${problem.slug}`);
        if (response.data && response.data.question) {
          let html = response.data.question;
          html = html.replace(/<p>&nbsp;<\/p>/g, '');
          html = html.replace(/<font face="monospace">&nbsp;<\/font>/g, '');
          
          await Problem.findByIdAndUpdate(problem._id, {
            description: html
          });
          console.log(`✅ Updated description for: ${problem.title}`);
          count++;
          success = true;
          break; // Success, exit retry loop
        } else {
          console.log(`⚠️ No description found for: ${problem.title}`);
          success = true; // Not a network error, just doesn't exist
          break;
        }
      } catch (e) {
        console.log(`❌ Failed to fetch ${problem.title} (Attempt ${attempt}/3)`);
        await new Promise(r => setTimeout(r, 2000)); // Wait before retry
      }
    }
    
    // Sleep to avoid rate limiting
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`Done updating ${count} descriptions!`);
  process.exit(0);
}

run().catch(console.error);
