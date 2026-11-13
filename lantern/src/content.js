// Lantern's built-in library. Every card is original writing that explains a
// well-known concept in plain words. `by` credits where the concept comes from.
const TOPICS = [
  { id: "focus", name: "Focus & Time", hue: 42 },
  { id: "mind", name: "Psychology", hue: 268 },
  { id: "habits", name: "Habits", hue: 152 },
  { id: "money", name: "Money", hue: 96 },
  { id: "health", name: "Health", hue: 8 },
  { id: "talk", name: "Communication", hue: 204 },
  { id: "phil", name: "Philosophy", hue: 320 },
  { id: "sci", name: "Science", hue: 182 },
  { id: "make", name: "Creativity", hue: 24 },
  { id: "lead", name: "Leadership", hue: 228 },
  { id: "learn", name: "Learning", hue: 128 },
  { id: "think", name: "Clear Thinking", hue: 296 },
];

const DECKS = [
  // ---------- Focus & Time ----------
  { id: "deepwork", topic: "focus", t: "Protecting deep work", by: "Concept popularised by Cal Newport", ideas: [
    ["Two kinds of work", "Deep work is hard, concentrated effort that produces something new. Shallow work is logistics: email, scheduling, status updates. Both are necessary, but only the first one builds skill and produces results people remember. Most calendars are arranged as if the opposite were true."],
    ["Attention residue", "When you switch tasks, part of your mind stays on the previous one for a while. A quick glance at a message costs more than the seconds it takes, because the next twenty minutes are done with a divided mind. Fewer switches gives you more of your own brain."],
    ["Schedule the depth, not the leftovers", "Waiting for a free afternoon means deep work never happens. Put a fixed block on the calendar, the same way you would for a meeting with someone you respect. Ninety minutes most days beats a heroic all-nighter once a month."],
    ["Make starting cheap", "A ritual removes the decision of how to begin. Same place, same drink, phone in another room, a written line saying what done looks like for this session. The less you have to decide at the start, the sooner real thinking begins."],
    ["Boredom is training", "If every idle moment gets filled by a screen, the brain learns that it never has to tolerate low stimulation. Then it rebels when asked to concentrate. Standing in a queue with nothing to look at is practice for staying with a hard problem."],
  ]},
  { id: "pareto", topic: "focus", t: "The 80/20 pattern", by: "Vilfredo Pareto's observation, applied", ideas: [
    ["Effort and results are not evenly matched", "In many systems a small share of causes produces most of the effect. A few customers bring most revenue, a few bugs cause most crashes, a few habits drive most of your health. The exact split varies, but the lopsidedness shows up again and again."],
    ["Find your vital few", "List what you did last month and mark what actually moved something forward. The marked items are usually a short list. Your job is to do more of those, and to notice how much of the rest could be done worse, later, or never."],
    ["The last 20% costs the most", "Getting something from good to perfect often takes as long as getting it from nothing to good. Sometimes perfect matters, as with a parachute. Often it does not. Decide in advance how good this particular thing needs to be."],
    ["It works in reverse too", "A few sources produce most of your stress: one client, one recurring meeting, one unresolved decision. Removing the worst source of friction frequently helps more than adding a new productivity trick."],
  ]},
  { id: "eisen", topic: "focus", t: "Urgent versus important", by: "The Eisenhower matrix", ideas: [
    ["Two questions, four boxes", "Ask of any task: does it matter, and is it due now? Important and urgent gets done. Important but not urgent gets scheduled. Urgent but unimportant gets delegated or done quickly. Neither gets dropped."],
    ["The quiet quadrant is where life improves", "Exercise, learning, planning, and relationships are important and almost never urgent. Nothing forces you to do them today, so they slide. People who seem ahead usually just protect time for this box."],
    ["Urgency is loud", "A ringing phone feels more pressing than a goal you set in January. Urgency is a feeling produced by deadlines and other people. Importance is a judgement you have to make yourself. Train yourself to pause between the feeling and the action."],
    ["Crises are often old neglect", "Many emergencies were once important, non-urgent tasks that got postponed. The car that breaks down missed its service. Doing the quiet work early is how you reduce the number of fires later."],
  ]},
  { id: "parkinson", topic: "focus", t: "Why work expands", by: "Parkinson's law and time boxing", ideas: [
    ["Work fills the time you give it", "Give a task a week and it takes a week. Give it two days and it usually still gets done. A long deadline invites extra polishing, extra worrying, and a late start. A tight one forces you to choose what matters."],
    ["Time boxing", "Decide how long something deserves before you begin, then stop when the time is up. You swap the question of when it will be finished for the question of what is the best version you can make in forty minutes."],
    ["The planning fallacy", "People underestimate how long their own tasks will take, even when they know that similar tasks ran late before. A simple correction is to ask how long this kind of thing took last time, and trust that number over your optimism."],
    ["Leave slack on purpose", "A schedule with no gaps breaks at the first surprise. Leaving a fifth of your day unassigned is what lets the rest of the plan survive contact with reality."],
  ]},

  // ---------- Psychology ----------
  { id: "twosystems", topic: "mind", t: "Fast and slow thinking", by: "Daniel Kahneman and Amos Tversky's research", ideas: [
    ["Two modes of mind", "One mode is quick, automatic, and effortless. It recognises faces and finishes familiar phrases. The other is slow and deliberate. It does long division and compares insurance plans. The quick mode runs most of the day, and it is usually good enough."],
    ["The lazy controller", "Careful thinking uses real effort, so the mind avoids it when it can. If a quick answer comes to mind and feels right, we tend to accept it without checking. Feeling certain and being correct are different things."],
    ["What you see is all there is", "We build confident stories from whatever information happens to be in front of us, and rarely ask what is missing. A candidate who interviews well seems competent. Before deciding, ask what you would want to know that you have not been shown."],
    ["Anchoring", "The first number you hear pulls your estimate toward it, even when it is arbitrary. This is why the opening offer in a negotiation matters, and why a crossed-out higher price makes the sale price feel like a bargain."],
    ["Losses weigh more than gains", "Losing fifty feels worse than finding fifty feels good. This makes people hold bad investments too long, avoid reasonable risks, and fight harder to keep what they have than to get something better."],
  ]},
  { id: "biases", topic: "mind", t: "Biases worth knowing", by: "Cognitive psychology research", ideas: [
    ["Confirmation bias", "We notice and remember evidence that agrees with what we already believe, and explain away the rest. The practical fix is to search deliberately for the strongest case against your view before you commit to it."],
    ["Availability", "Things that come to mind easily feel more common than they are. Plane crashes are vivid and reported, so flying feels riskier than driving. When judging how likely something is, ask whether you are counting cases or just recalling a memorable one."],
    ["The sunk cost trap", "Money and time already spent cannot be recovered, so they should not affect what you do next. Yet people finish bad films and keep funding failing projects because stopping feels like admitting waste. Ask only what the best choice is from here."],
    ["Hindsight", "Once we know how something turned out, it feels as though it was obvious all along. This makes us judge past decisions by their results instead of by what could reasonably have been known at the time."],
    ["Fundamental attribution error", "When someone else cuts in line we assume they are rude. When we do it, we know we were late for a good reason. We explain other people by their character and ourselves by our circumstances."],
  ]},
  { id: "mindset", topic: "mind", t: "Fixed and growth mindsets", by: "Carol Dweck's research", ideas: [
    ["Two beliefs about ability", "Some people treat talent as a fixed amount you either have or lack. Others treat it as something that grows with practice. The belief you hold shapes how you respond to difficulty far more than your current skill does."],
    ["What failure means", "With a fixed view, a bad result is a verdict on who you are, so you avoid situations where you might fail. With a growth view, the same result is information about what to work on next."],
    ["Praise the process", "Telling a child they are clever teaches them to protect that label by avoiding hard things. Praising effort, strategy, and persistence teaches them that those are the things under their control."],
    ["The word yet", "Saying you cannot do something states a permanent fact. Adding the word yet turns it into a position on a path. It is a small change in wording that keeps the door open."],
  ]},
  { id: "flow", topic: "mind", t: "The state of flow", by: "Mihaly Csikszentmihalyi's research", ideas: [
    ["Absorption", "Flow is the state of being so involved in an activity that time seems to change speed and self-consciousness fades. People describe it in climbing, coding, surgery, music, and conversation. They also describe it as among the best moments of their lives."],
    ["The challenge has to fit", "Flow appears when a task is slightly harder than your current skill. Too easy and you are bored. Too hard and you are anxious. As you improve, the task must get harder to stay in the channel."],
    ["Clear goals, quick feedback", "Activities that produce flow tell you what you are trying to do and whether you are doing it. A rock face does this. So does a musical phrase. Vague work with delayed feedback rarely does, unless you build the feedback in yourself."],
    ["Enjoyment is active", "Passive pleasures like scrolling are easy to start and leave little behind. Flow activities take effort to begin and feel better afterwards. That first bit of resistance is the price of entry."],
  ]},

  // ---------- Habits ----------
  { id: "habitloop", topic: "habits", t: "How habits work", by: "Behavioural research; popularised by Charles Duhigg and James Clear", ideas: [
    ["Cue, routine, reward", "A habit starts with a trigger, runs a routine, and ends with something the brain likes. After enough repetitions the trigger alone creates a craving for the reward. To change a habit you have to work on one of these three parts."],
    ["Make it obvious", "Behaviour follows what is in front of you. Fruit on the counter gets eaten. A guitar on a stand gets played. Rearranging your surroundings is easier than relying on willpower, because the surroundings work even when you are tired."],
    ["Start smaller than seems useful", "A habit must exist before it can improve. Two minutes of reading, one push-up, one sentence in a journal. The aim at first is to become someone who shows up. Volume comes later."],
    ["Stack it on something you already do", "Attach a new behaviour to an established one. After I pour my coffee, I write my three priorities. The old habit provides the cue for free, so you do not have to remember."],
    ["Never miss twice", "One missed day changes nothing. Two in a row is the beginning of a new pattern. When you slip, the only goal is to get the next repetition done, however small."],
  ]},
  { id: "identity", topic: "habits", t: "Habits and identity", by: "Ideas from James Clear and behavioural psychology", ideas: [
    ["Outcomes, processes, identity", "You can aim at a result, such as losing weight. You can aim at a process, such as cooking at home. Or you can aim at being a certain kind of person, such as someone who looks after their body. The last one lasts longest."],
    ["Every action is a vote", "Each time you write a page, you add evidence that you are a writer. No single vote decides it, but the tally adds up. You do not need to be perfect. You need a majority."],
    ["Small gains compound", "Improving by a tiny amount each day feels like nothing for a long time, then becomes visible all at once. The same is true in reverse for small neglects. Habits are the compound interest of behaviour."],
    ["The plateau of latent potential", "Early effort often shows no result, like heating ice from minus ten to minus one. Nothing appears to happen until the threshold is crossed. Most people quit in the stretch just before it."],
  ]},
  { id: "willpower", topic: "habits", t: "Designing for low willpower", by: "Behavioural design; B.J. Fogg and others", ideas: [
    ["Friction decides", "Each extra step between you and an action makes it less likely. Add steps to habits you want less of: log out, put the snacks on a high shelf. Remove steps from habits you want more of: lay out the running shoes the night before."],
    ["Motivation is unreliable", "Motivation rises and falls with sleep, mood, and weather. A plan that only works on good days fails on most days. Design the behaviour so that it is doable on your worst day."],
    ["Decide in advance", "A plan in the form of when X happens I will do Y removes the moment of choice. People who write down when and where they will exercise are far more likely to do it than people who only intend to."],
    ["Temptation bundling", "Pair something you should do with something you want to do. Only listen to a favourite podcast while walking. The want pulls the should along with it."],
  ]},

  // ---------- Money ----------
  { id: "compound", topic: "money", t: "Compounding", by: "Basic finance", ideas: [
    ["Growth on growth", "When returns are reinvested, each year's gain is calculated on a larger base than the last. The curve looks flat for years and then bends upward steeply. Most of the final amount arrives in the last third of the time."],
    ["Time beats amount", "Someone who invests modestly from twenty-five can end up with more than someone who invests twice as much from forty. The early starter has less money in but more years for it to work. The most valuable input is an early start."],
    ["The rule of 72", "Divide 72 by an annual growth rate to estimate how many years it takes to double. At 6% money doubles in about twelve years. At 3% it takes twenty-four. The same sum tells you how fast inflation halves your purchasing power."],
    ["Fees compound too", "A yearly fee of two percent sounds small, but it is taken from the whole balance every year. Over several decades it can consume a large share of the final sum. Low costs are one of the few things an investor fully controls."],
    ["Do not interrupt it", "Compounding only works if it is left alone. Selling in a panic and waiting to get back in breaks the chain. The investors who do best are often the ones who look least."],
  ]},
  { id: "enough", topic: "money", t: "The psychology of money", by: "Themes from behavioural finance", ideas: [
    ["Behaviour matters more than knowledge", "Financial success depends less on what you know than on how you act. A modest earner who saves steadily and stays calm often ends up better off than a clever one who chases every trend."],
    ["Wealth is what you do not see", "A new car shows that money was spent. Wealth is the money that was not spent: savings and investments that give you options. Looking rich and being rich frequently pull in opposite directions."],
    ["The moving goalpost", "If your expectations rise as fast as your income, you never feel better off. Deciding what enough means for you is what stops you from taking risks you do not need for things you do not want."],
    ["Room for error", "A plan that only works if everything goes right is fragile. Keeping more cash than seems efficient, and assuming lower returns than you hope for, lets you stay in the game long enough for luck to arrive."],
    ["Freedom is the real dividend", "The greatest thing money buys is control over your time: being able to change jobs, wait for the right opportunity, or handle a bad month without fear."],
  ]},
  { id: "budget", topic: "money", t: "Simple money rules", by: "Common personal finance practice", ideas: [
    ["Pay yourself first", "Move savings out on payday, automatically, before you see the money. What is left is what you spend. Saving whatever remains at the end of the month usually means saving nothing."],
    ["Emergency fund", "Three to six months of basic expenses held in cash turns a job loss or a broken boiler from a crisis into an inconvenience. It earns little, and that is fine. Its job is to keep you from borrowing at bad rates."],
    ["High-interest debt first", "Paying off a card charging twenty percent is a guaranteed twenty percent return. Almost no investment matches that. Clear expensive debt before you invest beyond any employer match."],
    ["Lifestyle creep", "Spending tends to rise with income without any decision being made. When you get a raise, set a rule to direct part of it to savings before it gets absorbed."],
  ]},

  // ---------- Health ----------
  { id: "sleep", topic: "health", t: "Sleep basics", by: "Sleep science", ideas: [
    ["Sleep is active", "During sleep the brain consolidates memories, clears metabolic waste, and regulates the hormones that control appetite and mood. Cutting sleep to gain time usually loses more in attention and judgement than the hours gained."],
    ["Two forces", "One force is a pressure that builds the longer you are awake. The other is a roughly twenty-four hour body clock. You sleep best when high pressure and the clock's night phase line up, which is why regular hours matter."],
    ["Light sets the clock", "Bright light in the morning anchors your rhythm earlier. Bright light late at night pushes it later. Getting outside soon after waking is one of the cheapest sleep aids there is."],
    ["Caffeine lingers", "Caffeine blocks the signal of sleep pressure and takes many hours to clear. A coffee at four in the afternoon can still be partly active at bedtime, making sleep lighter even if you fall asleep without trouble."],
    ["Cool, dark, regular", "A slightly cool room, real darkness, and the same wake time every day, weekends included, do more than most supplements. Consistency of timing is the lever people most often overlook."],
  ]},
  { id: "move", topic: "health", t: "Movement that lasts", by: "Exercise science consensus", ideas: [
    ["The biggest gain is from none to some", "The largest health improvement comes when an inactive person starts doing a little. Going from nothing to a daily brisk walk does more for long-term risk than going from fit to very fit."],
    ["Strength protects you", "Muscle mass declines with age unless it is used. Resistance training twice a week maintains bone density, balance, and the ability to do everyday things independently in later life."],
    ["Easy effort builds the base", "Most endurance training should be done at a pace where you can still hold a conversation. It builds the aerobic system without the fatigue that forces you to skip the next session."],
    ["Sitting is a separate problem", "Long uninterrupted sitting carries risk even for people who exercise. Standing up and moving for a couple of minutes every half hour is a small habit with a measurable effect."],
    ["Choose what you will repeat", "The best programme is the one you will still be doing in a year. Enjoyment and convenience predict consistency better than any optimal plan."],
  ]},
  { id: "stress", topic: "health", t: "Working with stress", by: "Stress physiology", ideas: [
    ["Stress is a response", "The body treats a deadline much as it would a predator: heart rate rises, attention narrows, digestion pauses. This is useful for minutes. Kept on for months, the same response wears the body down."],
    ["Finish the cycle", "Dealing with the cause of stress does not always tell your body the threat has passed. Physical activity, a long exhale, laughter, or time with someone you trust signals that it is safe to stand down."],
    ["The long exhale", "Breathing out for longer than you breathe in slows the heart through the vagus nerve. A few slow breaths, in for four and out for six or eight, is a tool you carry everywhere."],
    ["How you read it matters", "A racing heart before a talk can be read as fear or as readiness. People who interpret arousal as the body preparing to perform tend to do better than those who try to calm down."],
  ]},

  // ---------- Communication ----------
  { id: "listen", topic: "talk", t: "Listening well", by: "Counselling and negotiation practice", ideas: [
    ["Most listening is waiting", "While the other person talks, we are often preparing our reply. Real listening means putting your own response on hold and trying to understand what they mean, including what they are not quite saying."],
    ["Reflect before you respond", "Say back what you heard in your own words: so the deadline is the worry, more than the workload. If you got it wrong they will correct you. If you got it right they will feel understood, and usually say more."],
    ["Ask open questions", "Questions that begin with what or how invite explanation. Questions that can be answered yes or no close things down. What made that difficult opens more than was that difficult."],
    ["Leave the silence", "A pause after someone finishes often brings out the thing they were hesitating to say. Rushing to fill it takes that chance away. Counting to three is usually enough."],
    ["Advice last", "People mostly want to be heard before they want solutions. Offering a fix too soon tells them you want the conversation to end. Ask whether they want ideas or just a hearing."],
  ]},
  { id: "feedback", topic: "talk", t: "Giving feedback", by: "Management practice; ideas from Kim Scott and Marshall Rosenberg", ideas: [
    ["Care and candour together", "Useful feedback comes from showing that you care about the person and being direct about the problem. Kindness without directness is vague. Directness without kindness makes people stop listening."],
    ["Describe, do not judge", "Say what you observed and its effect: the report arrived two days late and the client meeting had to move. That is harder to argue with than you are unreliable, and it tells the person what to change."],
    ["Close to the event", "Feedback loses value with time. A brief word the same day is better than a detailed review three months later, when neither of you remembers the details."],
    ["Ask for it first", "People take criticism better from someone who invites it. Asking what you could do differently, and then acting on the answer, earns you the standing to be direct in return."],
  ]},
  { id: "persuade", topic: "talk", t: "How persuasion works", by: "Robert Cialdini's research on influence", ideas: [
    ["Reciprocity", "People feel obliged to return favours, even small or unrequested ones. This is why free samples work. Knowing it lets you give generously on purpose, and notice when a gift is being used to create a debt."],
    ["Social proof", "When unsure, we look at what others are doing. Reviews, queues, and bestseller lists all rely on this. It is a sensible shortcut that fails when the crowd is as uninformed as you are."],
    ["Scarcity", "Things seem more valuable when they are rare or about to run out. Only three left triggers a fear of missing out. Before acting, ask whether you would want it if there were plenty."],
    ["Commitment and consistency", "Once we take a small public position, we feel pressure to act in line with it. A small yes makes a larger yes more likely later. It is also why writing down a goal helps you keep it."],
    ["Authority and liking", "We are more easily persuaded by people who seem expert and by people we like. Both are reasonable guides and both are easy to fake with a title, a uniform, or a compliment."],
  ]},

  // ---------- Philosophy ----------
  { id: "stoic", topic: "phil", t: "Stoic practice", by: "Epictetus, Seneca, and Marcus Aurelius", ideas: [
    ["What is up to you", "Some things are in your control: your judgements, your choices, your effort. Everything else is not: other people, the weather, the outcome. The Stoics held that peace comes from putting your energy only into the first group."],
    ["Events and opinions", "It is our judgement about an event that upsets us, more than the event. A delayed train is a fact. That it has ruined the day is an opinion you added, and one you can revise."],
    ["Imagine the loss", "Briefly picturing life without something you value, such as your health, a friend, or your home, makes you more grateful for it now and steadier if it does go. The Stoics practised this deliberately."],
    ["The obstacle becomes the path", "A difficulty is also an occasion to practise a virtue: patience with a difficult person, courage in a setback. Seen this way, what blocks the path becomes part of it."],
    ["Remember you will die", "Keeping death in mind was meant to clarify what matters, and the Stoics did not find it morbid. If time is limited, much of what worries us shrinks, and postponing what is important looks less sensible."],
  ]},
  { id: "meaning", topic: "phil", t: "Meaning under pressure", by: "Viktor Frankl and existential thought", ideas: [
    ["The last freedom", "Even when circumstances cannot be changed, a person can still choose the attitude they take toward them. Frankl drew this from his years in concentration camps, and treated it as the one freedom that cannot be removed."],
    ["Meaning comes before happiness", "Happiness pursued directly tends to escape. It arrives as a side effect of being absorbed in something worthwhile: work, a person you love, or a hardship faced with dignity."],
    ["Three sources", "Meaning can be found in what you give to the world through work, in what you receive from it through love and beauty, and in the stance you take toward suffering you cannot avoid."],
    ["A why makes the how bearable", "People endure great difficulty when they see a purpose in it. Without a purpose, even comfort feels empty. Finding the why is often more useful than removing the difficulty."],
  ]},
  { id: "ethics", topic: "phil", t: "Three ways to judge an action", by: "Moral philosophy", ideas: [
    ["Consequences", "One tradition says an action is right if it produces the best overall results for everyone affected. It is practical and impartial. Its weakness is that it can seem to justify harming one person to benefit many."],
    ["Duties", "Another says some acts are right or wrong in themselves, whatever the outcome. Keep promises, do not lie, never treat a person merely as a tool. Its weakness is rigidity when duties conflict."],
    ["Character", "A third asks what a good person would do, more than which act is right. It focuses on building traits like honesty and courage through practice. Its weakness is that it gives less precise guidance in a hard case."],
    ["Use all three", "Most people reason with a mix. When the three agree, you can be confident. When they disagree, you have found a difficult problem, and noticing that is useful in itself."],
  ]},

  // ---------- Science ----------
  { id: "evolution", topic: "sci", t: "Natural selection", by: "Charles Darwin and modern biology", ideas: [
    ["Three ingredients", "Individuals vary. Some of that variation is inherited. Some variants leave more offspring than others. Given those three facts and enough time, populations change. Evolution is the logical result."],
    ["No foresight", "Selection cannot plan. It keeps what worked in the past environment. That is why bodies carry awkward compromises, like a human spine adapted from four-legged ancestors and prone to back pain."],
    ["Fit means suited", "Fitness in biology means reproductive success in a particular environment. It does not mean strength. A trait that helps in one setting can be a burden in another. No species is the best in general."],
    ["Deep time", "Small changes accumulate over spans that are hard to imagine. A change too slight to notice in a thousand generations can produce a new species over a million. Evolution seems unlikely mainly because human intuition has no feel for that much time."],
  ]},
  { id: "entropy", topic: "sci", t: "Energy and entropy", by: "Thermodynamics", ideas: [
    ["Energy is conserved", "Energy is never created or destroyed. It only changes form. Chemical energy in fuel becomes motion and heat. The total stays the same. This first law is why perpetual motion machines cannot work."],
    ["Disorder tends to increase", "In an isolated system, energy spreads out and things move toward more probable arrangements. Hot coffee cools to room temperature and never heats up by itself. This is the second law."],
    ["Why it is statistical", "There are vastly more disordered arrangements of particles than ordered ones. Systems drift toward disorder because, among all the states they could be in, nearly all are disordered. No force pushes them there."],
    ["Order needs an energy flow", "Living things, cities, and tidy rooms are local order. They are maintained by using energy and releasing more disorder elsewhere. Life obeys the second law. It is fed by sunlight."],
    ["The arrow of time", "Most physical laws work the same forwards and backwards. Entropy does not. The fact that it increases is what separates past from future, and why you remember yesterday and cannot remember tomorrow."],
  ]},
  { id: "method", topic: "sci", t: "How science knows things", by: "Philosophy of science", ideas: [
    ["Falsifiability", "A scientific claim should say what evidence would prove it wrong. A theory that can explain any possible result explains nothing. The strongest ideas forbid many things and survive the tests anyway."],
    ["Correlation and causation", "Two things moving together does not mean one causes the other. Ice cream sales and drownings both rise in summer. A third factor, chance, or reversed cause may be responsible. Controlled experiments exist to tell these apart."],
    ["The control group", "To know whether a treatment works, compare people who got it with similar people who did not. Without a comparison, natural recovery and the placebo effect look like success."],
    ["Replication", "One study is a hint. A finding becomes knowledge when other teams repeat it and get the same result. Many striking results fade when repeated, which is the system working as intended."],
    ["Proportion belief to evidence", "Confidence should come in degrees. Strong evidence earns strong belief, weak evidence earns tentative belief, and new evidence should shift you. Being certain is a claim about your evidence. It is not a character trait."],
  ]},

  // ---------- Creativity ----------
  { id: "ideas", topic: "make", t: "Where ideas come from", by: "Creativity research; James Webb Young and others", ideas: [
    ["New combinations", "Most new ideas are existing elements joined in a way nobody tried. The printing press combined the wine press and the coin punch. The more varied your raw material, the more combinations are open to you."],
    ["Collect before you need it", "Ideas come from material gathered earlier. Keep notes on what interests you, whether or not it seems useful. Later, the unrelated items are the ones that connect."],
    ["Then walk away", "After working hard on a problem, stepping back lets the mind keep working in the background. Solutions arrive in the shower or on a walk, but only after the effort has been put in first."],
    ["Quantity leads to quality", "People who produce the best ideas usually produce the most ideas, including many bad ones. Aim for volume first and judge afterwards. Editing while generating stops both."],
  ]},
  { id: "resistance", topic: "make", t: "Getting the work out", by: "Working practice of writers and artists", ideas: [
    ["The bad first draft", "Nobody writes well on the first pass. The purpose of a first draft is to exist so it can be improved. Permission to write badly is what gets the page filled."],
    ["Constraints help", "A blank page with unlimited options is paralysing. A limit, such as a word count, a deadline, or only three colours, gives you something to push against, and it forces invention."],
    ["Show up on a schedule", "Professionals do not wait for inspiration. They work at a set time and find that inspiration tends to arrive once they have started. Routine is what makes inspiration likely."],
    ["Ship it", "Unfinished work teaches you little, because you never learn how it lands. Finishing and releasing something imperfect gives you feedback, and a finished thing to build on."],
    ["Taste runs ahead of skill", "Beginners can tell their work is not yet good because their taste is already developed. That gap is discouraging, and the only way to close it is a large volume of work."],
  ]},

  // ---------- Leadership ----------
  { id: "trust", topic: "lead", t: "Building trust on a team", by: "Research on psychological safety; Amy Edmondson", ideas: [
    ["Psychological safety", "Teams perform best when people believe they can ask questions, admit mistakes, and disagree without being punished. It predicts results better than the talent of the individual members."],
    ["Go first", "People take their cue from the leader. If you say I was wrong about this, or I do not know, you show that it is safe. Asking for candour while punishing it teaches silence."],
    ["Respond well to bad news", "How you react when someone brings a problem decides whether you hear about the next one. Thank them, then deal with the problem. Blame makes problems go underground."],
    ["Safety is not softness", "A safe team still holds high standards and argues hard about ideas. The safety is what makes that possible. Without it, people agree in the meeting and object in the corridor."],
  ]},
  { id: "delegate", topic: "lead", t: "Delegating properly", by: "Management practice", ideas: [
    ["Hand over the outcome", "Describe the result you need and why it matters, and let the person work out the steps. Dictating the method removes their judgement and keeps you as the bottleneck."],
    ["Agree what done means", "Most delegation fails because the two people pictured different results. Spend two minutes agreeing what done looks like, by when, and what limits apply."],
    ["Match the check-ins to the person", "Someone new to a task needs frequent, short check-ins. Someone experienced needs room. Applying one style to everyone either smothers the capable or abandons the learner."],
    ["Good enough, done by someone else", "If another person can do a task four fifths as well as you, hand it over. Your time goes to work only you can do, and they improve with practice."],
    ["You stay accountable", "Handing over a task does not hand over responsibility for the result. If it goes wrong, that is yours to own in public and to coach on in private."],
  ]},
  { id: "decide", topic: "lead", t: "Deciding well", by: "Decision-making practice", ideas: [
    ["Doors that swing both ways", "Some decisions are hard to reverse, such as selling the company. Most are easy to undo, like trying a new pricing page. Reversible decisions should be made fast by small groups. Save slow deliberation for the irreversible few."],
    ["Decide at about 70 percent", "If you wait until you are nearly certain, you are usually too late. Acting on most of the information you wish you had, and correcting quickly, generally beats waiting."],
    ["Disagree and commit", "A team does not need everyone to agree. It needs everyone to be heard and then to back the decision fully. Half-hearted execution of a good plan loses to full commitment to a decent one."],
    ["The pre-mortem", "Before starting, imagine the project has failed a year from now and ask everyone to write down why. It brings out risks that people were reluctant to raise while the mood was optimistic."],
    ["Judge the decision, not the result", "Good decisions sometimes turn out badly and bad ones sometimes succeed, because luck is involved. Review whether the reasoning was sound given what was known, or you will learn the wrong lessons."],
  ]},

  // ---------- Learning ----------
  { id: "recall", topic: "learn", t: "Learning that sticks", by: "Cognitive science of learning", ideas: [
    ["Retrieval beats rereading", "Pulling information out of memory strengthens it far more than putting it in again. Close the book and write what you remember. It feels harder than rereading, and the difficulty is why it works."],
    ["Space it out", "Reviewing material after increasing gaps, such as a day, three days, then a week, makes it last much longer than the same time spent in one sitting. Forgetting a little before each review is part of how it works."],
    ["Mix the practice", "Practising one type of problem in a block feels smooth. Mixing types feels messy and produces better long-term skill, because you also practise recognising which method applies."],
    ["The illusion of fluency", "Text you have just read looks familiar, and familiarity is easy to mistake for knowledge. The test is whether you can explain it with the page closed."],
    ["Desirable difficulty", "Learning that feels easy often does not last. Conditions that slow you down, such as testing, spacing, and varying, produce durable memory. Effort is a sign that learning is happening."],
  ]},
  { id: "feynman", topic: "learn", t: "Explain it simply", by: "A technique associated with Richard Feynman", ideas: [
    ["Teach it to a beginner", "Choose a concept and explain it in plain language, as if to someone with no background. Jargon lets you hide gaps from yourself. Plain words expose them."],
    ["Find where you stumble", "The points where your explanation gets vague or you reach for a technical term are the edges of your understanding. Go back to the source for those parts only."],
    ["Use an analogy", "Linking a new idea to something familiar gives it a place to attach. Voltage is like water pressure. A good analogy also shows you where the comparison breaks down."],
    ["Knowing the name is not knowing the thing", "You can know what something is called in every language and still know nothing about how it behaves. Understanding means being able to predict what it will do."],
  ]},
  { id: "practice", topic: "learn", t: "Deliberate practice", by: "Anders Ericsson's research on expertise", ideas: [
    ["Experience is not practice", "Doing something for twenty years does not make you expert at it. Many people repeat their first year twenty times. Improvement needs effort aimed at specific weaknesses."],
    ["Work at the edge", "Useful practice sits just beyond what you can currently do. It involves frequent small failures. If a session feels comfortable, you are performing. You are not improving."],
    ["Get feedback fast", "You need to know quickly whether an attempt was right. A coach, a recording, or a clear target gives you this. Without it you practise your mistakes."],
    ["Break it into parts", "Experts isolate a sub-skill, such as one difficult bar of music or one kind of chess ending, and repeat it until it is solid. Then they put it back into the whole."],
    ["Short and intense", "This kind of practice is tiring. Even top performers manage only a few hours a day, often in sessions of about an hour. Rest is part of the method."],
  ]},

  // ---------- Clear Thinking ----------
  { id: "models", topic: "think", t: "Mental models to carry", by: "Ideas collected by Charlie Munger and others", ideas: [
    ["The map is not the territory", "Every model, plan, and statistic is a simplification of reality. Models are useful because they leave things out, and for the same reason they are sometimes wrong. When the map and the ground disagree, believe the ground."],
    ["Inversion", "Asking how to succeed is one approach. Asking what would guarantee failure, and then avoiding those things, is another. Avoiding stupidity is often easier than achieving brilliance."],
    ["Second-order effects", "Every action has consequences, and those consequences have consequences. Ask and then what at least twice. Many bad decisions look good if you only consider the first step."],
    ["Circle of competence", "Know the limits of what you understand. Inside them you can act with confidence. Outside them you are guessing. The size of your circle matters less than knowing where its edge is."],
    ["Occam's razor", "When several explanations fit the facts, start with the one that makes the fewest assumptions. It will not always be right, but it is the most efficient place to begin testing."],
  ]},
  { id: "firstp", topic: "think", t: "First principles", by: "A method traced to Aristotle", ideas: [
    ["Reason from the ground up", "Most thinking is by analogy: this is how it is usually done. First-principles thinking breaks a problem down to the facts you are sure of and builds upward from there."],
    ["Ask why until you reach bedrock", "Take an assumption and ask why it is true. Then ask again of the answer. After several rounds you reach either a real constraint or a habit that only looked like one."],
    ["Conventions and laws are different", "A physical law cannot be broken. An industry convention can. Much innovation comes from spotting that something everyone treats as a law is only a convention."],
    ["Use it selectively", "Reasoning from scratch is slow, and convention usually exists for good reasons. Save it for problems that matter, where the standard answer is clearly unsatisfactory."],
  ]},
  { id: "prob", topic: "think", t: "Thinking in probabilities", by: "Statistics and forecasting research", ideas: [
    ["Replace yes or no with how likely", "Few things are certain. Putting a rough number on a belief, such as seventy percent, lets you update it in small steps as evidence arrives. Otherwise you flip between extremes."],
    ["Start with the base rate", "Before looking at the details of a case, ask how often this kind of thing happens in general. Most new restaurants close within a few years, whatever this one's menu is like."],
    ["Update in proportion", "Strong evidence should move you a lot and weak evidence a little. Changing your whole view over one anecdote is an error. So is ignoring a large study because it is inconvenient."],
    ["Expected value", "Multiply each outcome by its chance and add them up. A bet that usually loses can still be worth taking if the rare win is large enough. A bet that usually wins can still be a bad one."],
    ["Regression to the mean", "Extreme results are usually followed by more ordinary ones, because luck was part of the extreme. The exceptional quarter and the terrible game both tend to be followed by something closer to average."],
  ]},
];
