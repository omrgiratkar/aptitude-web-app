export function calculateScore(questions, answers) {
  const answerMap = new Map((answers || []).map(a => [String(a.questionId), Number(a.selectedOption)]));
  let correctCount = 0;
  const review = questions.map(q => {
    const selectedOption = answerMap.has(String(q._id ?? q.questionId))
      ? answerMap.get(String(q._id ?? q.questionId)) : null;
    const correct = selectedOption !== null && selectedOption === Number(q.correctOption);
    if (correct) correctCount++;
    return {
      questionId: String(q._id ?? q.questionId),
      questionText: q.questionText,
      options: q.options,
      selectedOption,
      correctOption: Number(q.correctOption),
      isCorrect: correct,
      explanation: q.explanation,
      category: q.category,
      difficulty: q.difficulty
    };
  });
  return { score: correctCount, total: questions.length, correctCount, review };
}
