import {Devvit} from "@devvit/public-api";
import {onReport} from "./handlers/events.js";
import {validateUsernameList} from "devvit-helpers";

Devvit.configure({
    redditAPI: true,
});

Devvit.addSettings([
    {
        type: "string",
        name: "ignorableAuthors",
        defaultValue: "AutoModerator,subreddit-ModTeam",
        label: "Auto-ignorable authors (comma-separated usernames)",
        helpText: "Comments and posts made by these users will be auto-ignored if they contain the configured keyword.",
        onValidate: validateUsernameList,
    },
    {
        type: "string",
        name: "enableIgnoreKeywordBody",
        defaultValue: "[](#autoignorereports)",
        label: "Auto-ignore keyword (in body)",
        helpText: "Comment and post bodies containing this keyword will be auto-ignored if they are made by an ignorable author. Leave blank to auto-ignore all comments and posts made by ignorable authors.",
    },
    {
        type: "string",
        name: "enableIgnoreKeywordTitle",
        defaultValue: "[DAILY Q&A]",
        label: "Auto-ignore keyword (in title)",
        helpText: "Posts this keyword in the title will be auto-ignored if they are made by an ignorable author. Leave blank to auto-ignore all posts made by ignorable authors.",
    },
]);

Devvit.addTrigger({
    events: ["PostReport", "CommentReport"],
    onEvent: onReport,
});

export default Devvit;
