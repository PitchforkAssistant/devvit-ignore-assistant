import {RedditAPIClient} from "@devvit/public-api";

export async function getUsernameFromUserId (reddit: RedditAPIClient, userId: string): Promise<string> {
    return reddit.getUserById(userId).then(user => user.username);
}
