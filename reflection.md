# Is this project even worth?

What is the application of making the data query layer malleable? That's NOT malleable ODI.

Maybe for espn, box score, I could actually see different information about the live score of a warriors vs spurs match.

Like if Steph hits a clutch three, having a client-side adaptive querying layer could open opportunities to use outside context or social media context and update the data schema to include steph's box score or his career stats

^ but then why does that have to come from the client?

Actually, it doesn't have to be from the client. We could have a malleable query layer adjust to serverside changes to context.

Tehre could be like outside data that we also combine. That could actually change the data query...

For the client, end-users could actually throw in or share some of the players they're interested in or click some things or drag some things, and that will pass in as context to update the query layer.

But then, there's also that question of how does having a malleable query layer affect the interface? This seems to affect the performance more. Like if it's only for HCI research, you could just fetch all the data and worry about how efficiently you're fetching data in engineering, but not the design no? I want to know what the separation is between engineering and the design research.

For widgets in chatgpt's appkit or something, what if they designed widgets that were much more flexible?

Graceful Degredation.. [https://dl.acm.org/doi/pdf/10.1145/964442.964469]
