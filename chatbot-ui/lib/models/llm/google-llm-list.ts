import { LLM } from "@/types"

const GOOGLE_PLATORM_LINK = "https://ai.google.dev/"

// Google Models (UPDATED 01/25/25) -----------------------------

// Gemini 2.0 Flash Exp (UPDATED 01/25/25)
const GEMINI_2_0_FLASH_EXP: LLM = {
  modelId: "gemini-2.0-flash-exp",
  modelName: "Gemini 2.0 Flash Exp",
  provider: "google",
  hostedId: "gemini-2.0-flash-exp",
  platformLink: GOOGLE_PLATORM_LINK,
  imageInput: true
}

// Gemini 1.5 Pro Latest (UPDATED 05/28/24)
const GEMINI_1_5_PRO: LLM = {
  modelId: "gemini-1.5-pro-latest",
  modelName: "Gemini 1.5 Pro",
  provider: "google",
  hostedId: "gemini-1.5-pro-latest",
  platformLink: GOOGLE_PLATORM_LINK,
  imageInput: true
}

// Gemini 1.5 Pro 002 (UPDATED 01/25/25)
const GEMINI_1_5_PRO_002: LLM = {
  modelId: "gemini-1.5-pro-002",
  modelName: "Gemini 1.5 Pro 002",
  provider: "google",
  hostedId: "gemini-1.5-pro-002",
  platformLink: GOOGLE_PLATORM_LINK,
  imageInput: true
}

// Gemini 1.5 Flash
const GEMINI_1_5_FLASH: LLM = {
  modelId: "gemini-1.5-flash",
  modelName: "Gemini 1.5 Flash",
  provider: "google",
  hostedId: "gemini-1.5-flash",
  platformLink: GOOGLE_PLATORM_LINK,
  imageInput: true
}

// Gemini 1.5 Flash 002 (UPDATED 01/25/25)
const GEMINI_1_5_FLASH_002: LLM = {
  modelId: "gemini-1.5-flash-002",
  modelName: "Gemini 1.5 Flash 002",
  provider: "google",
  hostedId: "gemini-1.5-flash-002",
  platformLink: GOOGLE_PLATORM_LINK,
  imageInput: true
}

// Gemini Pro (UPDATED 12/22/23)
const GEMINI_PRO: LLM = {
  modelId: "gemini-pro",
  modelName: "Gemini Pro",
  provider: "google",
  hostedId: "gemini-pro",
  platformLink: GOOGLE_PLATORM_LINK,
  imageInput: false
}

// Gemini Pro Vision (UPDATED 12/22/23)
const GEMINI_PRO_VISION: LLM = {
  modelId: "gemini-pro-vision",
  modelName: "Gemini Pro Vision",
  provider: "google",
  hostedId: "gemini-pro-vision",
  platformLink: GOOGLE_PLATORM_LINK,
  imageInput: true
}

export const GOOGLE_LLM_LIST: LLM[] = [
  GEMINI_2_0_FLASH_EXP,
  GEMINI_1_5_PRO,
  GEMINI_1_5_PRO_002,
  GEMINI_1_5_FLASH,
  GEMINI_1_5_FLASH_002,
  GEMINI_PRO,
  GEMINI_PRO_VISION
]
