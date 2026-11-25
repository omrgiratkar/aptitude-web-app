import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDB } from "./config/db.js";
import User from "./models/User.js";
import Question from "./models/Question.js";

const questions = [
  [
    "Quantitative Aptitude",
    "Easy",
    "What is 25% of 240?",
    ["40", "50", "60", "80"],
    2,
    "25% is one quarter. 240 ÷ 4 = 60.",
  ],
  [
    "Quantitative Aptitude",
    "Easy",
    "A product costs ₹500 and is discounted by 10%. What is the sale price?",
    ["₹400", "₹450", "₹475", "₹490"],
    1,
    "10% of ₹500 is ₹50. Sale price = ₹500 − ₹50 = ₹450.",
  ],
  [
    "Quantitative Aptitude",
    "Easy",
    "Find the average of 6, 8, and 10.",
    ["6", "7", "8", "9"],
    2,
    "Average = (6 + 8 + 10) / 3 = 8.",
  ],
  [
    "Quantitative Aptitude",
    "Medium",
    "A train travels 180 km in 3 hours. What is its average speed?",
    ["45 km/h", "50 km/h", "60 km/h", "75 km/h"],
    2,
    "Speed = distance ÷ time = 180 ÷ 3 = 60 km/h.",
  ],
  [
    "Quantitative Aptitude",
    "Medium",
    "If 3x = 42, what is x + 5?",
    ["12", "14", "19", "21"],
    2,
    "x = 42 ÷ 3 = 14, so x + 5 = 19.",
  ],
  [
    "Quantitative Aptitude",
    "Hard",
    "A sum doubles in 8 years at simple interest. What is the annual rate?",
    ["10%", "12.5%", "15%", "20%"],
    1,
    "If the sum doubles, interest equals principal over 8 years. Rate = 100/8 = 12.5% per year.",
  ],
  [
    "Reasoning",
    "Easy",
    "Choose the next number: 2, 4, 6, 8, __.",
    ["9", "10", "11", "12"],
    1,
    "The sequence increases by 2 each time. The next number is 10.",
  ],
  [
    "Reasoning",
    "Easy",
    "Which one is different?",
    ["Apple", "Mango", "Carrot", "Banana"],
    2,
    "Carrot is commonly classified as a vegetable; the others are fruits.",
  ],
  [
    "Reasoning",
    "Easy",
    "If CAT is coded as DBU by shifting each letter one step forward, DOG is coded as:",
    ["EPH", "EOG", "DPH", "FQI"],
    0,
    "D→E, O→P, and G→H, so DOG becomes EPH.",
  ],
  [
    "Reasoning",
    "Medium",
    "Find the next number: 3, 6, 12, 24, __.",
    ["30", "36", "42", "48"],
    3,
    "Each term is multiplied by 2. The next term is 48.",
  ],
  [
    "Reasoning",
    "Medium",
    "All roses are flowers. Some flowers fade quickly. Which conclusion must be true?",
    [
      "All roses fade quickly",
      "Some roses fade quickly",
      "All roses are flowers",
      "No flowers are roses",
    ],
    2,
    "The first statement explicitly says all roses are flowers. The second does not establish that any roses fade quickly.",
  ],
  [
    "Reasoning",
    "Hard",
    "A is taller than B. C is taller than A. D is shorter than B. Who is tallest?",
    ["A", "B", "C", "D"],
    2,
    "C is taller than A, and A is taller than B; D is shorter than B. Therefore C is tallest.",
  ],
  [
    "Verbal/English",
    "Easy",
    "Choose the synonym of 'rapid'.",
    ["Slow", "Quick", "Quiet", "Weak"],
    1,
    "Rapid means fast or quick.",
  ],
  [
    "Verbal/English",
    "Easy",
    "Choose the correctly spelled word.",
    ["Accomodate", "Acommodate", "Accommodate", "Acomodate"],
    2,
    "The correct spelling is accommodate, with double c and double m.",
  ],
  [
    "Verbal/English",
    "Easy",
    "Choose the correct article: She ate ___ apple.",
    ["a", "an", "thee", "no article"],
    1,
    "Use 'an' before a vowel sound. Apple begins with a vowel sound.",
  ],
  [
    "Verbal/English",
    "Medium",
    "Choose the grammatically correct sentence.",
    [
      "He don't like tea.",
      "He doesn't likes tea.",
      "He doesn't like tea.",
      "He not like tea.",
    ],
    2,
    "With 'doesn't', use the base form of the verb: like.",
  ],
  [
    "Verbal/English",
    "Medium",
    "Choose the antonym of 'scarce'.",
    ["Rare", "Limited", "Abundant", "Small"],
    2,
    "Scarce means insufficient or hard to find; abundant means plentiful.",
  ],
  [
    "Verbal/English",
    "Hard",
    "Choose the best completion: 'Had I known about the delay, I ___ earlier.'",
    ["will leave", "would have left", "left", "would leave"],
    1,
    "This is an inverted third conditional: Had I known..., I would have left earlier.",
  ],
];

try {
  await connectDB();
  const name = process.env.SEED_ADMIN_NAME || "Application Admin";
  const email = (
    process.env.SEED_ADMIN_EMAIL || "admin@example.com"
  ).toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || "ChangeMe_Admin_123!";
  let admin = await User.findOne({ email });
  if (!admin) {
    admin = await User.create({
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: "admin",
    });
    console.log(`Created seed Admin: ${email}`);
  } else console.log(`Seed Admin already exists: ${email}`);
  let added = 0;
  for (const [
    category,
    difficulty,
    questionText,
    options,
    correctOption,
    explanation,
  ] of questions) {
    const exists = await Question.exists({
      category,
      difficulty,
      questionText,
    });
    if (!exists) {
      await Question.create({
        category,
        difficulty,
        questionText,
        options,
        correctOption,
        explanation,
        active: true,
      });
      added++;
    }
  }
  console.log(
    `Seeded ${added} sample questions. Add more questions in Admin Question Bank before setting a large test size.`,
  );
  await (await import("mongoose")).default.disconnect();
} catch (e) {
  console.error(e);
  process.exit(1);
}
