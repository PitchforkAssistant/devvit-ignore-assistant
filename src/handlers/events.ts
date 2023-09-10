import {PostReport, CommentReport} from "@devvit/protos";
import {TriggerContext, OnTriggerEvent, RedditAPIClient, SettingsValues} from "@devvit/public-api";
import {asT2ID, asT3ID} from "@devvit/shared-types/tid.js";
import {getUsernameFromUserId, ignoreReportsByPostId} from "devvit-helpers";

export async function onReport (event: OnTriggerEvent<PostReport> | OnTriggerEvent<CommentReport>, context: TriggerContext) {
    console.log("Got report event!");

    const settings = await context.settings.getAll();
    if (!settings.ignorableAuthors) {
        console.log("No ignorable authors configured!");
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
    const authorId = event.post?.authorId ?? "";
    const ignorableAuthors = settings["ignorableAuthors"]?.toString().toLowerCase().split(",") ?? "";
    const enableIgnoreKeywordTitle = settings["enableIgnoreKeywordTitle"]?.toString() ?? "";
    const enableIgnoreKeywordBody = settings["enableIgnoreKeywordBody"]?.toString() ?? "";
    if (!authorId || !ignorableAuthors || !post) {
        throw new Error(`No author ID, ignorable authors, or post data: ${JSON.stringify(event)}`);
    }
    console.log(`Got report event for ${post.id} by ${authorId}`);

    const author = (await getUsernameFromUserId(reddit, asT2ID(authorId))).toLowerCase();
    console.log(ignorableAuthors);
    console.log(author);
    if (ignorableAuthors.includes(author)) {
        if (post.title.includes(enableIgnoreKeywordTitle) || (post.selftext ?? "").includes(enableIgnoreKeywordBody)) {
            console.log(`Ignoring ${post.id} reports!`);
            ignoreReportsByPostId(reddit, asT3ID(post.id)).catch(() => console.error(`Failed to ignore ${post.id} reports!`));
        } else {
            console.log(`No keyword in ${post.id}!`);
        }
    } else {
        console.log("No author or author not in ignorable authors.");
    }
}

async function onCommentReport (event: OnTriggerEvent<CommentReport>, reddit: RedditAPIClient, settings: SettingsValues) {
    const comment = event.comment;
    const authorId = event.comment?.author ?? "";
    const ignorableAuthors = settings["ignorableAuthors"]?.toString().toLowerCase().split(",") ?? "";
    const enableIgnoreKeyword = settings["enableIgnoreKeywordBody"]?.toString() ?? "";
    if (!authorId || !ignorableAuthors || !comment) {
        throw new Error(`No author ID, ignorable authors, or comment data: ${JSON.stringify(event)}`);
    }
    console.log(`Got report event for ${comment.id} by ${authorId}`);

    const author = (await getUsernameFromUserId(reddit, asT2ID(authorId))).toLowerCase();
    console.log(author);
    console.log(ignorableAuthors);
    if (ignorableAuthors.includes(author)) {
        if (comment.body.includes(enableIgnoreKeyword)) {
            console.log(`Ignoring ${comment.id} reports!`);
            reddit.approve(comment.id).catch(() => console.error(`Failed to approve ${comment.id}!`));
            // Apparently this doesn't exist for comments yet?
            // comment.ignoreReports().catch(() => console.error(`Failed to ignore ${comment.id} reports!`));
        } else {
            console.log(`No keyword in ${comment.id}!`);
        }
    } else {
        console.log("Author not in ignorable authors.");
    }
}
