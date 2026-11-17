# Sentiment analysis

Sentiment is **not a separate dashboard widget** in this prototype.

It is a display mode of **Text analysis**, turned on with **Show sentiment** when the widget is created or edited.

Read: [`text-analysis.PRD.md`](./text-analysis.PRD.md)

## What “sentiment” means here

For each classified topic (and sub-topic) on an open-ended question, responses are counted as **Negative**, **Neutral**, or **Positive**.

- The widget shows that mix as a three-color bar of equal width, with counts in each segment and the total at the end.
- Clicking the bar opens all comments. Pills in the modal switch between All / Negative / Neutral / Positive.

This is comment sentiment on free text. It is not the Scorecard’s Unfavorable / Neutral / Favorable split on closed-ended marker scores.

## Why it is not its own widget

The themes, source question, and comments are the same whether sentiment is on or off. A second catalog item would duplicate setup and split a single reading path (“what came up” → “how people feel about it” → “read the comments”).
