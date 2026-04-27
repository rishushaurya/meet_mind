// MeetMind - Demo Transcripts and Mock Responses (Chunk 05)

const demoData = {
  // Demo 1: College Project Planning
  demo1: {
    id: 'demo1',
    title: 'Project Planning Sync',
    attendees: ['Rahul', 'Priya', 'Amit', 'Sneha'],
    transcript: `Rahul: Alright, so we need to finalize our project. I think I should handle the backend API since I've been working with Node.js.
Priya: That works. I'll take the frontend -- I can use React or maybe just vanilla JS to keep it simple.
Amit: I'll build the ML model. I need the dataset by Wednesday though. Rahul, can you set up the data pipeline?
Sneha: I'll handle the presentation and the README. But we need to decide which API to use for the AI part.
Rahul: Let's go with Gemini -- it has the best free tier. I'll set it up by Thursday.
Priya: Sounds good. I need the API endpoints documented before the weekend so I can connect the frontend.
Amit: What about the dataset? Are we using the Kaggle one or generating our own?
Sneha: I think Kaggle is faster. Let's not waste time on that.
Rahul: Agreed. Amit, grab the Kaggle dataset and preprocess it by Wednesday.
Priya: One more thing -- should we deploy on Vercel or Render?
Sneha: Vercel is easier. Rahul, can you handle deployment too?
Rahul: Sure, I'll set up Vercel after the backend is ready.`,
    response: {
      "meeting_summary": "The team finalized roles for their project. Rahul will handle the backend and deployment, Priya will build the frontend, Amit will develop the ML model, and Sneha is responsible for the presentation. They agreed to use the Gemini API and a Kaggle dataset to save time.",
      "meeting_type": "brainstorm",
      "host": "Rahul",
      "health_score": {
        "score": 8,
        "reasoning": "Productive session with clear role distribution and decisions made quickly. Only minor dependencies need tight coordination."
      },
      "decisions_made": [
        "Use Gemini API for the AI component",
        "Use Kaggle dataset instead of generating custom data",
        "Deploy the application on Vercel"
      ],
      "unresolved_questions": [],
      "topics_not_discussed": [
        "Specific project scope to target",
        "Design mockups or UI theme"
      ],
      "attendees": [
        {
          "name": "Rahul",
          "action_items": [
            {
              "task": "Handle the backend API",
              "priority": "important",
              "deadline": null,
              "depends_on": null,
              "source_quote": "I think I should handle the backend API since I've been working with Node.js."
            },
            {
              "task": "Set up the data pipeline",
              "priority": "urgent",
              "deadline": "Wednesday",
              "depends_on": null,
              "source_quote": "Rahul, can you set up the data pipeline?"
            },
            {
              "task": "Set up Gemini API",
              "priority": "important",
              "deadline": "Thursday",
              "depends_on": null,
              "source_quote": "I'll set it up by Thursday."
            },
            {
              "task": "Handle Vercel deployment",
              "priority": "normal",
              "deadline": null,
              "depends_on": null,
              "source_quote": "Sure, I'll set up Vercel after the backend is ready."
            }
          ],
          "talk_percentage": 35,
          "key_quotes": ["Let's go with Gemini -- it has the best free tier."],
          "questions_asked": 0
        },
        {
          "name": "Priya",
          "action_items": [
            {
              "task": "Build the frontend using vanilla JS or React",
              "priority": "important",
              "deadline": null,
              "depends_on": null,
              "source_quote": "I'll take the frontend -- I can use React or maybe just vanilla JS to keep it simple."
            },
            {
              "task": "Connect frontend to API endpoints",
              "priority": "important",
              "deadline": "Before the weekend",
              "depends_on": "Rahul",
              "source_quote": "I need the API endpoints documented before the weekend so I can connect the frontend."
            }
          ],
          "talk_percentage": 25,
          "key_quotes": ["One more thing -- should we deploy on Vercel or Render?"],
          "questions_asked": 1
        },
        {
          "name": "Amit",
          "action_items": [
            {
              "task": "Build the ML model",
              "priority": "important",
              "deadline": null,
              "depends_on": "Rahul",
              "source_quote": "I'll build the ML model. I need the dataset by Wednesday though."
            },
            {
              "task": "Grab Kaggle dataset and preprocess it",
              "priority": "urgent",
              "deadline": "Wednesday",
              "depends_on": null,
              "source_quote": "Amit, grab the Kaggle dataset and preprocess it by Wednesday."
            }
          ],
          "talk_percentage": 15,
          "key_quotes": ["What about the dataset? Are we using the Kaggle one or generating our own?"],
          "questions_asked": 1
        },
        {
          "name": "Sneha",
          "action_items": [
            {
              "task": "Handle the presentation and README",
              "priority": "important",
              "deadline": null,
              "depends_on": null,
              "source_quote": "I'll handle the presentation and the README."
            }
          ],
          "talk_percentage": 25,
          "key_quotes": ["I think Kaggle is faster. Let's not waste time on that."],
          "questions_asked": 0
        }
      ],
      "follow_up_suggestions": [
        "Schedule a sync on Thursday to review the Gemini API integration",
        "Create a shared document for API endpoint specs"
      ]
    }
  },

  // Demo 2: Startup Standup
  demo2: {
    id: 'demo2',
    title: 'Startup Standup',
    attendees: ['Alex', 'Maya', 'Jordan'],
    transcript: `Alex: Alright team, let's do our standup. I'm still working on the Stripe integration. Ran into some webhook issues yesterday.
Maya: I need that Stripe API before I can finish the checkout flow. When do you think it'll be ready?
Alex: Probably by end of day today. I'll ping you.
Jordan: We need to push the marketing campaign live tomorrow. If checkout isn't working, we're burning ad money.
Alex: I know, I know. I'm prioritizing stability over speed right now so we don't drop transactions.
Jordan: Can we pause the ads?
Maya: I already emailed the agency to pause the top-of-funnel ads until Thursday. But Jordan, you need to update the landing page copy by tomorrow morning to reflect the new pricing.
Jordan: On it. I'll have the copy done tonight. Maya, did you fix the mobile nav bug?
Maya: Yes, deployed it this morning.
Alex: Great. So I'll finish Stripe today, Maya finishes checkout tomorrow, and Jordan handles copy tonight.
Jordan: Perfect. Let's reconvene tomorrow at 10.`,
    response: {
      "meeting_summary": "The startup team discussed blockers related to the upcoming product launch. Alex is troubleshooting Stripe webhooks, which is blocking Maya's checkout flow work. Jordan raised concerns about running ads with a broken checkout, but Maya has already paused them. Jordan will update the landing page copy by tonight.",
      "meeting_type": "standup",
      "host": "Alex",
      "health_score": {
        "score": 6,
        "reasoning": "Standup revealed a critical blocker (Stripe) causing cascading delays. The team successfully pivoted to pause ads, but tension is present regarding the timeline."
      },
      "decisions_made": [
        "Pause top-of-funnel marketing ads until Thursday",
        "Prioritize checkout stability over speed"
      ],
      "unresolved_questions": [
        "Will the Stripe integration definitely be finished by end of day today?"
      ],
      "topics_not_discussed": [
        "Customer support readiness for launch",
        "Post-launch monitoring plan"
      ],
      "attendees": [
        {
          "name": "Alex",
          "action_items": [
            {
              "task": "Finish Stripe integration and fix webhook issues",
              "priority": "urgent",
              "deadline": "End of day today",
              "depends_on": null,
              "source_quote": "Probably by end of day today. I'll ping you."
            },
            {
              "task": "Ping Maya when Stripe API is ready",
              "priority": "important",
              "deadline": "Today",
              "depends_on": null,
              "source_quote": "I'll ping you."
            }
          ],
          "talk_percentage": 40,
          "key_quotes": ["I'm prioritizing stability over speed right now so we don't drop transactions."],
          "questions_asked": 0
        },
        {
          "name": "Maya",
          "action_items": [
            {
              "task": "Finish the checkout flow",
              "priority": "urgent",
              "deadline": "Tomorrow",
              "depends_on": "Alex",
              "source_quote": "I need that Stripe API before I can finish the checkout flow."
            }
          ],
          "talk_percentage": 30,
          "key_quotes": ["I already emailed the agency to pause the top-of-funnel ads until Thursday."],
          "questions_asked": 1
        },
        {
          "name": "Jordan",
          "action_items": [
            {
              "task": "Update the landing page copy with new pricing",
              "priority": "important",
              "deadline": "Tonight",
              "depends_on": null,
              "source_quote": "On it. I'll have the copy done tonight."
            }
          ],
          "talk_percentage": 30,
          "key_quotes": ["If checkout isn't working, we're burning ad money."],
          "questions_asked": 2
        }
      ],
      "follow_up_suggestions": [
        "Review Stripe integration status at tomorrow's 10 AM standup"
      ]
    }
  },

  // Demo 3: Internship Check-in
  demo3: {
    id: 'demo3',
    title: 'Internship Check-in',
    attendees: ['Sarah', 'Dev'],
    transcript: `Sarah: Hey Dev, how was your first week?
Dev: It was great! I read through all the onboarding docs and set up my local environment.
Sarah: Awesome. Did you get access to the GitHub repo yet?
Dev: No, I requested it yesterday but it's still pending.
Sarah: Okay, I'll approve that right after this call. So for this week, I want you to start by looking at the bug backlog. Pick two "good first issue" tickets and try to fix them by Friday.
Dev: Sounds good. I'll need some help understanding the codebase though.
Sarah: No problem. Ping me on Slack when you've picked the tickets and we'll do a quick pair programming session.
Dev: Will do. Oh, and HR asked me to submit my timesheet by Wednesday.
Sarah: Got it. Don't forget to submit that, it's important. I'll review it on Thursday morning.
Dev: Thanks Sarah. That's all from me.`,
    response: {
      "meeting_summary": "Sarah and Dev had a weekly internship sync. Dev successfully completed onboarding but is blocked on GitHub access. Sarah will approve his access and assigned him two 'good first issue' tickets to resolve by Friday. Dev needs to submit his timesheet by Wednesday for Sarah to review.",
      "meeting_type": "check-in",
      "host": "Sarah",
      "health_score": {
        "score": 9,
        "reasoning": "Quick, effective check-in. Blockers were identified and resolved, and clear goals were set for the week."
      },
      "decisions_made": [
        "Dev will tackle two 'good first issue' tickets this week."
      ],
      "unresolved_questions": [],
      "topics_not_discussed": [
        "Long-term intern project goals"
      ],
      "attendees": [
        {
          "name": "Sarah",
          "action_items": [
            {
              "task": "Approve Dev's GitHub repository access request",
              "priority": "urgent",
              "deadline": "Today",
              "depends_on": null,
              "source_quote": "Okay, I'll approve that right after this call."
            },
            {
              "task": "Review Dev's timesheet",
              "priority": "important",
              "deadline": "Thursday morning",
              "depends_on": "Dev",
              "source_quote": "I'll review it on Thursday morning."
            },
            {
              "task": "Pair programming session with Dev",
              "priority": "normal",
              "deadline": null,
              "depends_on": "Dev",
              "source_quote": "Ping me on Slack when you've picked the tickets and we'll do a quick pair programming session."
            }
          ],
          "talk_percentage": 50,
          "key_quotes": ["I want you to start by looking at the bug backlog. Pick two 'good first issue' tickets and try to fix them by Friday."],
          "questions_asked": 2
        },
        {
          "name": "Dev",
          "action_items": [
            {
              "task": "Pick and fix two 'good first issue' tickets from the bug backlog",
              "priority": "important",
              "deadline": "Friday",
              "depends_on": "Sarah",
              "source_quote": "Pick two 'good first issue' tickets and try to fix them by Friday."
            },
            {
              "task": "Ping Sarah on Slack to schedule pair programming",
              "priority": "normal",
              "deadline": null,
              "depends_on": null,
              "source_quote": "Ping me on Slack when you've picked the tickets"
            },
            {
              "task": "Submit timesheet to HR",
              "priority": "urgent",
              "deadline": "Wednesday",
              "depends_on": null,
              "source_quote": "HR asked me to submit my timesheet by Wednesday."
            }
          ],
          "talk_percentage": 50,
          "key_quotes": ["I read through all the onboarding docs and set up my local environment."],
          "questions_asked": 0
        }
      ],
      "follow_up_suggestions": [
        "Check in with Dev on Wednesday to ensure he has picked the tickets."
      ]
    }
  }
};

window.demo = {
  getDemoTranscript(id) {
    return demoData[id] || null;
  },
  
  getDemoResponse(id) {
    if (demoData[id] && demoData[id].response) {
      return demoData[id].response;
    }
    return null;
  },

  isDemoId(id) {
    return !!demoData[id];
  }
};
