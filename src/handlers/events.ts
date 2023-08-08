import {PostReport, CommentReport} from "@devvit/protos";
import {Context, OnTriggerEvent, RedditAPIClient, SettingsValues} from "@devvit/public-api";
import {getUsernameFromUserId} from "../helpers/redditHelpers.js";

export async function onReport (event: OnTriggerEvent<PostReport> | OnTriggerEvent<CommentReport>, context: Context) {
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
    const authorId = event.post?.authorId ?? "";
    const ignorableAuthors = settings["ignorableAuthors"]?.toString().toLowerCase().split(",") ?? "";
    const enableIgnoreKeywordTitle = settings["enableIgnoreKeywordTitle"]?.toString() ?? "";
    const enableIgnoreKeywordBody = settings["enableIgnoreKeywordBody"]?.toString() ?? "";
    if (!authorId || !ignorableAuthors) {
        console.log("No author ID or ignorable authors");
    }

    console.log(`Got report event for ${event.post?.id ?? "post!"}`);

    const author = (await getUsernameFromUserId(reddit, authorId)).toLowerCase();
    console.log(ignorableAuthors);
    console.log(author);
    if (author && ignorableAuthors.includes(author)) {
        const post = await reddit.getPostById(event.post?.id ?? "");
        if (post) {
            if (post.title.includes(enableIgnoreKeywordTitle) || (post.body ?? "").includes(enableIgnoreKeywordBody)) {
                console.log(`Ignoring ${post.id} reports!`);
                post.approve().catch(() => console.error(`Failed to approve ${post.id}!`));
                post.ignoreReports().catch(() => console.error(`Failed to ignore ${post.id} reports!`));
            } else {
                console.log(`No keyword in ${post.id}!`);
            }
        } else {
            console.log("No post?");
        }
    } else {
        console.log("No author or author not in ignorable authors.");
    }
}

async function onCommentReport (event: OnTriggerEvent<CommentReport>, reddit: RedditAPIClient, settings: SettingsValues) {
    const authorId = event.comment?.author ?? "";
    const ignorableAuthors = settings["ignorableAuthors"]?.toString().toLowerCase().split(",") ?? "";
    const enableIgnoreKeyword = settings["enableIgnoreKeywordBody"]?.toString() ?? "";
    if (!authorId || !ignorableAuthors) {
        console.log("No author ID or ignorable authors");
    }

    console.log(`Got report event for ${event.comment?.id ?? "comment!"}`);

    const author = (await getUsernameFromUserId(reddit, authorId)).toLowerCase();
    console.log(ignorableAuthors);
    console.log(author);
    if (author && ignorableAuthors.includes(author)) {
        const comment = await reddit.getCommentById(event.comment?.id ?? "");
        if (comment) {
            if (comment.body.includes(enableIgnoreKeyword)) {
                console.log(`Ignoring ${comment.id} reports!`);
                comment.approve().catch(() => console.error(`Failed to approve ${comment.id}!`));
                // Apparently this doesn't exist for comments yet?
                // comment.ignoreReports().catch(() => console.error(`Failed to ignore ${comment.id} reports!`));
            } else {
                console.log(`No keyword in ${comment.id}!`);
            }
        } else {
            console.log("No comment?");
        }
    } else {
        console.log("No author or author not in ignorable authors.");
    }
}
