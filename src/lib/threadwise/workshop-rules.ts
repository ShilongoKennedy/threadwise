export function voteTotal(votes: { user_id: string; dots: number }[], userId: string) {
  return votes.filter((v) => v.user_id === userId).reduce((sum, v) => sum + v.dots, 0);
}
export function canVote(phase: string, used: number, budget: number) {
  return phase === "vote" && used < budget;
}
