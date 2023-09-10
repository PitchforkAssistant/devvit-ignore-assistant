import {PostReport, CommentReport} from "@devvit/protos";
import {TriggerContext, OnTriggerEvent, RedditAPIClient, SettingsValues} from "@devvit/public-api";
import {getUsernameFromUserId, ignoreReportsByPostId} from "devvit-helpers";

export async function onReport (event: OnTriggerEvent<PostReport> | OnTriggerEvent<CommentReport>, context: TriggerContext) {
    const settings = await context.settings.getAll();
    if (!settings.ignorableAuthors) {
        return;
    }

    if (event.type === "PostReport") {
        return onPostReport(event as OnTriggerEvent<PostReport>, context.reddit, settings);
    } else if (event.type === "CommentReport") {
        return onCommentReport(event as OnTriggerEvent<CommentReport>, context.reddit, settings);
    }
}

async function onPostReport (event: OnTriggerEvent<PostReport>, reddit: RedditAPIClient, settings: SettingsValues) {
    const post = event.post;
    const ignorableAuthors = settings.ignorableAuthors?.toString().toLowerCase().split(",") ?? "";
    const enableIgnoreKeywordTitle = String(settings.enableIgnoreKeywordTitle);
    const enableIgnoreKeywordBody = String(settings.enableIgnoreKeywordBody);
    if (!ignorableAuthors || !post || !enableIgnoreKeywordTitle || !enableIgnoreKeywordBody) {
        throw new Error(`No author ID, ignorable authors, or post data: ${JSON.stringify(event)}`);
    }
    console.log(`Got report event for ${post.id} by ${post.authorId}`);

    const author = (await getUsernameFromUserId(reddit, post.authorId)).toLowerCase();
    if (ignorableAuthors.includes(author)) {
        if (post.title.includes(enableIgnoreKeywordTitle) || (post.selftext ?? "").includes(enableIgnoreKeywordBody)) {
            console.log(`Ignoring ${post.id} reports!`);
            await ignoreReportsByPostId(reddit, post.id).catch(e => console.error(`Failed to ignore ${post.id} reports!`, e));
        }
    }
}

async function onCommentReport (event: OnTriggerEvent<CommentReport>, reddit: RedditAPIClient, settings: SettingsValues) {
    const comment = event.comment;
    const ignorableAuthors = settings.ignorableAuthors?.toString().toLowerCase().split(",") ?? "";
    const enableIgnoreKeyword = String(settings.enableIgnoreKeywordBody);
    if (!ignorableAuthors || !comment || !enableIgnoreKeyword) {
        throw new Error(`No author ID, ignorable authors, or comment data: ${JSON.stringify(event)}`);
    }
    console.log(`Got report event for ${comment.id} by ${comment.author}`);

    const author = (await getUsernameFromUserId(reddit, comment.author)).toLowerCase();
    if (ignorableAuthors.includes(author)) {
        if (comment.body.includes(enableIgnoreKeyword)) {
            console.log(`Ignoring ${comment.id} reports!`);
            await reddit.approve(comment.id).catch(e => console.error(`Failed to approve ${comment.id}!`, e));
            // Apparently this doesn't exist for comments yet?
            // comment.ignoreReports().catch(() => console.error(`Failed to ignore ${comment.id} reports!`));
        }
    }
}
