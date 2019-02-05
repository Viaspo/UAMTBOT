let Discord = require('discord.js');
let auth = require('./auth.json');
let fs = require("fs");
let ideas = JSON.parse(fs.readFileSync('ideas.json', 'utf8'));
let glob = require( 'glob' );
let path = require( 'path' );

// BOT SETUP
let bot = new Discord.Client({});
bot.on("error", (e) => console.error(e));
bot.on("warn", (e) => console.warn(e));
bot.on("debug", (e) => {});
bot.on('ready', function (evt) {
    console.log(`Logged in as ${this.user.tag}!`);
});

// COMMAND SETUP
bot.commands = [];
glob.sync( './commands/*.js' ).forEach( function( file ) {
    let Command = require( path.resolve( file ) );
    bot.commands.push(new Command());
});

// MAIN CALLBACK
bot.on('message', function (msg) {
    // STOP ON OTHER BOTS
    if (msg.author.bot) { return; }

    // SOME GENERIC STUFF
    if (msg.content.toLowerCase().includes("good bot")) {
        msg.channel.send("Thanks! I try my best!");
    } else if (msg.mentions.users.exists('id', bot.user.id)) {
       msg.channel.send("Hello there! You called me? If you wanna know how to interact with me properly, type in `]help` and I will tell you!");
    } else if (msg.content.substring(0, 1) === ']') {
        // This is the magic - command parsing!
        let args = msg.content.substring(1).split(' ');
        let cmd = args[0];

        // Help section
        if (cmd === 'help') {
            if (args.length >= 2) {
                // try to find help for one command
                for (let com of this.commands) {
                    if (com.supports(args[1])) {
                        msg.channel.send("Help for ]" + args[1] + ":\n" + com.help());
                        return;
                    }
                }
            } else {
                let help = "Hello there! I am your friendly [UAMT] bot.\nMy commands are:\n";
                for (let com of this.commands) { help += com.shorlist.map(i => "]" + i).join(" / ") + " - " + com.shortHelp() + "\n"; }
                msg.channel.send(help);
                return;
            }
        }

        // Command execution part
        for (let com of this.commands) {
            if (com.supports(cmd)) {
                com.run(msg, args);
                return;
            }
        }

        switch(cmd) {
            case "ideas":
                let uid = msg.author.id;
                let unm = msg.author.username;
                let unma = "you are";
                if (args.length >= 2) {
                    if (args[1] == 'clear' || args[1] == 'clean' || args[1] == 'purge') {
                        ideas[msg.author.id] = [];
                        msg.channel.send("Forgetting all your ideas. None of them were any good, anyway...");
                        fs.writeFile( "ideas.json", JSON.stringify(ideas), "utf8", function(error) {} );
                        break;
                    } else {
                        // find user
                        var uname = args.slice(1).join(" ").replace("@", "");
                        var foundUs = [];
                        msg.guild.members.forEach((member) => {
                            if ((member.nickname != null && member.nickname.toLowerCase().includes(uname.toLowerCase()))
                                || (member.user.username.toLowerCase().includes(uname.toLowerCase()))) {
                                foundUs.push(member.id);
                                unm = member.nickname == null ? member.user.username : member.nickname;
                                unma =  unm + " is";
                            }
                        });

                        if (foundUs.length == 0) {
                            msg.channel.send("Sorry, I don't know anyone called '" + uname + "'.");
                            break;
                        } else if (foundUs.length > 1) {
                            msg.channel.send("Mate, I know **many** people called '" + uname + "'...");
                            break;
                        } else {
                            uid = foundUs[0];
                        }
                    }
                }
                // List them
                if (!ideas[uid] || ideas[uid].length == 0) {
                    if (uid == 246332093808902144) {
                        msg.channel.send("WOW! " + unma + " is so full of ideas that I can't even show them all!");
                    } else if (uid == 412352063125717002) {
                        msg.channel.send("gASK ~~keeps an ogranized list of ideas~~ puts all his ideas in a huge assorted pile on Trello.\nhttps://trello.com/b/1VpT0EUe/aground-modding");
                    } else {
                        msg.channel.send("Sorry, seems like " + unma + " is out of ideas!");
                    }
                }
                else {
                    msg.channel.send(unm +"'s idea list:");
                    let i = 1;
                    let idealist = "";
                    ideas[uid].forEach(function(element) {
                        idealist += "\n " + (i++) + ".: " + element.replace("@", "");
                    });
                    msg.channel.send(idealist);
                }
                break;
            case "finishidea":
            case "finish":
                var finish = true;
            case "remove":
            case "clear":
            case "clean":
            case "removeidea":
            case "remidea":
                var id = args.slice(1).join(" ");
                if (isNaN(id)) {
                    // convert to number
                    id = ideas[msg.author.id].indexOf(id);
                } else { id -= 1; }
                // remove by id
                var idea = ideas[msg.author.id][id];
                if (idea != null && ideas[msg.author.id].splice(id,1).length > 0) {
                   if (finish) {
                       msg.channel.send("Good job finally finishing " + idea.replace("@", "") + ", " + msg.author.username + "!");
                   } else {
                        msg.channel.send(idea.replace("@", "") + " was not a good one anyway ...");
                   }
                } else {
                    msg.channel.send("What are you on about?");
                }
                fs.writeFile( "ideas.json", JSON.stringify(ideas), "utf8", function(error) {} );
                break;
            case "idea":
                // Add idea
                if (args.length < 2) { msg.channel.send("Proper usage is ]idea {idea to save}. Got it?"); return; }
                var idea = args.slice(1).join(" ").replace("@", "");
                if (!ideas[msg.author.id]) { ideas[msg.author.id] = [] }
                ideas[msg.author.id].push(idea);
                fs.writeFile( "ideas.json", JSON.stringify(ideas), "utf8", function(error) {} );
                msg.channel.send(idea + "? What a great idea, " + msg.author.username + "! I am saving that for you as idea #" + (ideas[msg.author.id].length) + ".");
                break;
            case "redo":
                // Redo Idea
                var id = args.slice(1).join(" ");
                if (isNAN(id)) {
                   let id = ideas[msg.author.id].indexOf(id);
                } else { id -= 1; }
                var idea = ideas[msg.author.id][id];
                if (args.length < 3) {
                    msg.channel.send("What are you going to replace " + idea + " with, " + msg.author.username + "?");
                    return;
                }
                if (args.length < 2) {
                    msg.channel.send("Uh.. redo **what** idea, exactly?");
                    return;
                }
                else {
                    switch(args[2]) {
                    if (isNAN(id)) {
                            let id = ideas[msg.author.id].indexOf(id);
                            }
                        }      
                    }
                var newidea = args.slice(1).join(" ").replace("@", "");
                if (args.length >= 3 && idea != null && ideas[msg.author.id].splice(id,1).length > 0) {
                    ideas[msg.author.id].replace(idea, newidea);
                    fs.writeFile( "ideas.json", JSON.stringify(ideas), "utf8", function(error) {} );
                    msg.channel.send("Okay, " + msg.author.username + ", the job is done!");
                }
                break;
            case "item":
                if (args.length < 3) {
                    msg.channel.send("Usage: ]item {name} {type} [{weight} {cost}]");
                    msg.channel.send("Supported types: food | resource | potion | weapon");
                } else {
                    switch(args[2]) {
                        case "potion":
                        case "resource":
                        case "food":
                            msg.channel.send('```xml\n<item id="' + args[1].replace("@", "") + '" type="' + (args.length > 2 ? args[2].replace("@", "") : "food") + '" cost="' + (args.length > 4 ? args[4].replace("@", "") : "0") + '" weight="' + (args.length > 3 ? args[3].replace("@", "") : "0") + '" icon="' + args[1].replace("@", "") + '.ico" />```');
                            break;
                        case "weapon":
                            msg.channel.send('```xml\n<item id="' + args[1].replace("@", "") + '" type="equipment" slot="weapon" durability="500" cost="' + (args.length > 4 ? args[4].replace("@", "") : "0") + '" weight="' + (args.length > 3 ? args[3].replace("@", "") : "0") + '" attack="0" cut="0" stamina="0" knockback="0" icon="' + args[1].replace("@", "") + '.ico" animation="' + args[1].replace("@", "") + '" action="equip" movement_walk="walk_rswing" critical="false" />```');
                            break;
                    }
                }
              break;
        }
    }
});

bot.login(auth.token);

for (let com of bot.commands) {
    com.setBot(bot); com.setAuth(auth);
}
