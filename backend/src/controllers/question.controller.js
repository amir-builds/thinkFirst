import { Question } from "../models/question.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createQuestion = asyncHandler(async (req, res) => {
  const questionInstance = new Question(req.app.locals.db);
  const questionData = {
    ...req.body,
    created_by_admin: req.admin.id
  };

  const question = await questionInstance.create(questionData);
  res.status(201).json(new ApiResponse(201, question, "Question created successfully"));
});

export const getAllQuestions = asyncHandler(async (req, res) => {
  const questionInstance = new Question(req.app.locals.db);
  const questions = await questionInstance.findAll();
  res.json(new ApiResponse(200, questions));
});

export const getPublicQuestions = asyncHandler(async (req, res) => {
  const questionInstance = new Question(req.app.locals.db);
  const questions = await questionInstance.findPublic();
  res.json(new ApiResponse(200, questions));
});

export const getQuestionById = asyncHandler(async (req, res) => {
  const questionInstance = new Question(req.app.locals.db);
  const question = await questionInstance.findById(req.params.id);
  
  if (!question) {
    throw new ApiError(404, "Question not found");
  }

  res.json(new ApiResponse(200, question));
});

export const updateQuestion = asyncHandler(async (req, res) => {
  const questionInstance = new Question(req.app.locals.db);
  const question = await questionInstance.update(req.params.id, req.body);
  res.json(new ApiResponse(200, question, "Question updated successfully"));
});

export const deleteQuestion = asyncHandler(async (req, res) => {
  const questionInstance = new Question(req.app.locals.db);
  await questionInstance.delete(req.params.id);
  res.json(new ApiResponse(200, null, "Question deleted successfully"));
});

export const toggleQuestionPublic = asyncHandler(async (req, res) => {
  const questionInstance = new Question(req.app.locals.db);
  const question = await questionInstance.togglePublic(req.params.id);
  res.json(new ApiResponse(200, question, "Question visibility toggled"));
});
