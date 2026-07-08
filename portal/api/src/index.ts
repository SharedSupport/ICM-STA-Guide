// Entry point referenced by package.json's "main". Each import below runs its
// module's app.http(...)/app.timer(...) registration call as a side effect.
import "./functions/getItems";
import "./functions/markReviewed";
import "./functions/refreshDailyItems";
