import {SettingsFormFieldValidatorEvent} from "@devvit/public-api";

export async function validateAllowedAuthors (event: SettingsFormFieldValidatorEvent<string>) {
    const allowedAuthorsString = event?.value?.toString() ?? "";
    if (!allowedAuthorsString) {
        return;
    } else {
        if (allowedAuthorsString.includes("/u/")) {
            return "Please enter a list of usernames separated by commas, not including the /u/ prefix.";
        } else if (allowedAuthorsString.includes("u/")) {
            return "Please enter a list of usernames separated by commas, not including the u/ prefix.";
        } else if (allowedAuthorsString.includes(" ")) {
            return "Please enter a list of usernames separated by commas, not including spaces.";
        } else if (allowedAuthorsString.endsWith(",")) {
            return "Please enter a list of usernames separated by commas, do not use a trailing comma.";
        }

        // Usernames can be 3-20 characters long, but there are special cases like subredditNameHere-ModTeam,
        // where it can be 21+8=29 characters. Subreddit names are limited to 21 characters.
        const allowedAuthorsRegex = new RegExp(/^[a-zA-Z0-9_-]{3,29}(,[a-zA-Z0-9_-]{3,29})*$/);
        if (!allowedAuthorsRegex.test(allowedAuthorsString)) {
            return "List is invalid. Either you have entered an impossible username or otherwise messed up.";
        }
    }
}
