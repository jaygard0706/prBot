const { clientId, guildId, token, APIKEY} = require('./config.json');
const Discord = require('discord.js');
const fs = require('fs');
const https = require('https');
const fetch = require("node-fetch");
const client = new Discord.Client({ intents: [
  "GUILDS" ,
  "GUILD_MEMBERS" ,
  "GUILD_INTEGRATIONS" ,
  "GUILD_MESSAGES" ,
  "GUILD_MESSAGE_REACTIONS"] });

const mods = [
  `422184269025247233`, //Goldenboi
  `363391047365165058`, //Erol
  `329051076835934222`  //Candy
]

client.once('ready', async () => {
  const prs = require('./prs.json');
  for(let r of prs.regionList){
    await client.guilds.cache.get(prs[r].guildid).channels.cache.get(prs[r].channelid).messages.fetch(prs[r].messageid);
  }
  console.log('Ready!');
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

  console.log(`${interaction.commandName}:${interaction.commandId}`);

	const { commandName } = interaction;
  const prs = require('./prs.json');

  if(commandName === `set_region`){
    region = interaction.options.getString("region");
    channelId = interaction.options.getChannel("channel").id;

    if(!prs.regionList.includes(region.toLowerCase())){
      prs.regionList.push(region.toLowerCase());
      c = await interaction.guild.channels.fetch(channelId)
      message = await c.send(`Placeholder message for future PR`)
      obj = {
        events: [],
        standings:{
          ids: []
        },
        guildid: interaction.guildId,
        channelid: channelId,
        messageid: message.id,
        latestTourney: 0
      }
      prs[region.toLowerCase()] = obj;
    }else{
      c = await client.guilds.cache.get(prs[region.toLowerCase()].guildid).channels.fetch(prs[region.toLowerCase()].channelid)
      m = await c.messages.fetch(prs[region.toLowerCase()].messageid)
      m.delete();
      prs[region.toLowerCase()].guildid = interaction.guildId;
      prs[region.toLowerCase()].channelid = channelId;
      c = await interaction.guild.channels.fetch(channelId)
      message = await c.send(`Placeholder message for future PR`)
      prs[region.toLowerCase()].messageid = message.id;
    }
    writeJSON('./prs.json', prs)
    interaction.reply(`Created region `);
    return;
  }
  else if(commandName === `remove_region`){
    region = interaction.options.getString("region");

    if(!prs.regionList.includes(region.toLowerCase())){
      s = `No region with this name, current region list:\n`
      for(let r of prs.regionList){
        s += `${r}\n`
      }
      interaction.reply(s);
      return;
    }

    c = await interaction.guild.channels.fetch(prs[region.toLowerCase()].channelid)
    m = await c.messages.fetch(prs[region.toLowerCase()].messageid)
    m.delete();

    prs[region.toLowerCase()] = undefined;
    prs.regionList.splice(prs.regionList.findIndex(e => e == region.toLowerCase()), 1);
    writeJSON('./prs.json', prs);
    interaction.reply(`Removed the entire ${region.toLowerCase()} region`)
    return;
  }
  else if(commandName === `add_event_to_region`){
    region = interaction.options.getString("region");
    slug = interaction.options.getString("event_slug");
    multiplier = interaction.options.getNumber("event_type");

    if(!prs.regionList.includes(region.toLowerCase())){
      s = `No region with this name, current region list:\n`
      for(let r of prs.regionList){
        s += `${r}\n`
      }
      interaction.reply(s);
      return;
    }
    data = await loadEvent(slug);
    prs[region.toLowerCase()].events.push({slug: slug, multiplier: multiplier, event: data.event});
    writeJSON('./prs.json', prs);
    //updateAll();
    interaction.reply(`Added event to ${region.toLowerCase()}: ${slug}\nMake sure to use /update_prs when you're done adding events`);
    return;
  }
  else if(commandName === `remove_event_from_region`){
      region = interaction.options.getString("region");
      slug = interaction.options.getString("event_slug");

      if(!prs.regionList.includes(region.toLowerCase())){
        s = `No region with this name, current region list:\n`
        for(let r of prs.regionList){
          s += `${r}\n`
        }
        interaction.reply(s);
        return;
      }

      index = prs[region.toLowerCase()].events.findIndex(e => e.slug == slug);
      if(index < 0){
        s = `No event with this slug, current event list:\n`;
        for(let e of prs[region.toLowerCase()].events){
          s += `${e.slug}\n`;
        }
        interaction.reply(s);
        return;
      }

      prs[region.toLowerCase()].events.splice(index, 1);
      //updateAll();

      interaction.reply(`Removed event from ${region.toLowerCase()}: ${slug}\nMake sure to use /update_prs when you're done adding events`);
      return;
  }
  else if(commandName === `update_prs`){
    updateAll();
    interaction.reply(`All PRs have been updated`);
    return;
  }
  else if(commandName === `get_points`){
    playerName = interaction.options.getString("player");
    showStats = interaction.options.getString("show_stats");

    s = `PR points for ${playerName}:\n`;
    for(let r of prs.regionList){
      for(let u of prs[r].standings.ids){
        if(prs[r].standings[u].name.toLowerCase() == playerName.toLowerCase()){
          s += `  - **${r}**: ${prs[r].standings[u].points.toFixed(2)}`;
          if(showStats != null && showStats == `Show`){
            function isIndex(element, index, array) {
              return element == u;
            }
            function getLBLine(userObj, ids, index){
              function addSpacesToNum(num, s){
                while(s.length < num){
                  s += ` `;
                }
                return s;
              }
              function findStanding(i){
                var standing = i + 1;
                while(i > 0 && prs[r].standings[ids[i-1]].points == userObj.points){
                  standing--;
                  i--;
                }
                return standing;
              }
              function cutName(s){
                return (s.length <= 12 ? s : `${s.slice(0,10)}..`)
              }
              s = ``;
              s += `${findStanding(index)}.`
              s = addSpacesToNum(3, s);
              s += cutName(userObj.name);
              s = addSpacesToNum(17, s);
              s += `| ${userObj.t1}`;
              s = addSpacesToNum(22, s);
              s += `| ${userObj.t2}`;
              s = addSpacesToNum(27, s);
              s += `| ${userObj.t3}`;
              s = addSpacesToNum(32, s);
              s += `| ${userObj.t8}`;
              s = addSpacesToNum(37, s);
              s += `| ${userObj.t16}`;
              s = addSpacesToNum(42, s);
              s += `|`;
              return s;
            }
            s += `: \`${getLBLine(prs[r].standings[u], prs[r].standings.ids, prs[r].standings.ids.findIndex(isIndex))}\``;
          }
          s += `\n`
          break;
        }
      }
    }

    if(s ==`PR points for ${playerName}:\n`){
      interaction.reply(`The player \"${playerName}\" was not found`);
      return;
    }
    interaction.reply(s);
    return;
  }
});

client.login(token);

async function delay(milliseconds){
    return new Promise(resolve => {
        setTimeout(resolve, milliseconds);
    });
}

async function updateAll(){
  var prs = require('./prs.json');
  prs = await updateEvents(prs);
  prs = await updateStandings(prs);
  updateMessages(prs);
  writeJSON('./prs.json', prs)
}

async function updateEvents(prs){
  latestTourney = 0;
  for(i = 0 ; i < prs.regionList.length ; i++){
    for(j = 0 ; j < prs[prs.regionList[i]].events.length ; j++){
      data = await loadEvent(prs[prs.regionList[i]].events[j].slug);
      prs[prs.regionList[i]].events[j].event = data.event;
      if(latestTourney < data.event.startAt){
        latestTourney = data.event.startAt;
      }
    }
    prs[prs.regionList[i]].latestTourney = latestTourney;
  }
  return prs;
}

async function updateStandings(){
  const prs = require('./prs.json');

  function findDiscriminator(gamerTag){
    for(let r of prs.regionList){
      for(let e of prs[r].events){
        for(let t of e.event.standings.nodes){
          for(let u of t.entrant.participants){
            if(u.gamerTag == gamerTag && u.user != null){
              return u.user;
            }
          }
        }
      }
    }
    return null;
  }

  for(let r of prs.regionList){
    lb = [];
    prs[r].standings = {ids: []};
    for(let e of prs[r].events){
      // if(e.event.standings == undefined){
      //   continue;
      // }
      for(let t of e.event.standings.nodes){
        for(let u of t.entrant.participants){
          if(u.user == null){
            u.user = findDiscriminator(u.gamerTag);
            if(u.user == null){
              continue;
            }
          }
          recency = Math.max(0, 1 - ((((prs[r].latestTourney - e.event.startAt)/60)/60)/24)/300);
          points = (33 - t.standing) * e.multiplier * recency;
          if(!lb.includes(u.user.discriminator)){
            obj = {
              name: u.gamerTag,
              points: points,
              t1: (t.standing == 1 ? 1 : 0),
              t2: (t.standing == 2 ? 1 : 0),
              t3: (t.standing == 3 ? 1 : 0),
              t8: (t.standing <= 8 && t.standing > 3 ? 1 : 0),
              t16: (t.standing <= 16 && t.standing > 8 ? 1 : 0)
            }
            lb.push(u.user.discriminator);
            prs[r].standings[u.user.discriminator] = obj;
          }else{
            prs[r].standings[u.user.discriminator].points = prs[r].standings[u.user.discriminator].points + points;
            switch(t.standing){
              case 1:
                prs[r].standings[u.user.discriminator].t1++;
                break;
              case 2:
                prs[r].standings[u.user.discriminator].t2++;
                break;
              case 3:
                prs[r].standings[u.user.discriminator].t3++;
                break;
              default:
                if(t.standing <= 8) prs[r].standings[u.user.discriminator].t8++;
                else prs[r].standings[u.user.discriminator].t16++;
            }
          }
        }
      }
    }

    function compare(a, b){
      if(prs[r].standings[a].points > prs[r].standings[b].points){
        return -1;
      }else if(prs[r].standings[b].points > prs[r].standings[a].points){
        return 1;
      }
      return 0;
    }
    lb.sort(compare);
    prs[r].standings.ids = lb;
  }
  return prs;
}

async function updateMessages(){
  const prs = require('./prs.json');
  for(let r of prs.regionList){
    message = client.guilds.cache.get(prs[r].guildid).channels.cache.get(prs[r].channelid).messages.cache.get(prs[r].messageid);

    if(prs[r].standings.ids.length == 0){
      message.edit(`Placeholder message for future PR`);
      continue;
    }

    function getLBLine(userObj, ids, index){
      function addSpacesToNum(num, s){
        while(s.length < num){
          s += ` `;
        }
        return s;
      }
      function findStanding(i){
        var standing = i + 1;
        while(i > 0 && prs[r].standings[ids[i-1]].points == userObj.points){
          standing--;
          i--;
        }
        return standing;
      }
      function cutName(s){
        return (s.length <= 12 ? s : `${s.slice(0,10)}..`)
      }
      s = ``;
      s += `${findStanding(index)}.`
      s = addSpacesToNum(3, s);
      s += cutName(userObj.name);
      s = addSpacesToNum(17, s);
      s += `| ${userObj.t1}`;
      s = addSpacesToNum(22, s);
      s += `| ${userObj.t2}`;
      s = addSpacesToNum(27, s);
      s += `| ${userObj.t3}`;
      s = addSpacesToNum(32, s);
      s += `| ${userObj.t8}`;
      s = addSpacesToNum(37, s);
      s += `| ${userObj.t16}`;
      s = addSpacesToNum(42, s);
      s += `|`;
      return s;
    }

    s = `\`\`\`\nFormat: Nr. player name | 1st | 2nd | 3rd | top 8 | top 16 |\n`;
    for(var i = 0 ; i < prs[r].standings.ids.length && s.length + 60 < 2000 ; i++){
      if(prs[r].standings[prs[r].standings.ids[i]].points == 0) break;
      s += getLBLine(prs[r].standings[prs[r].standings.ids[i]], prs[r].standings.ids, i);
      s += `\n`;
    }
    s += `\`\`\``;

    message.edit(s);
  }
}

async function queryAPI(query, variables) {
  return await fetch('https://api.smash.gg/gql/alpha', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + APIKEY
    },
    body: JSON.stringify({
      query,
      variables: variables,
    })
  }).then(r => { return r.json() }).catch(err => console.log(err));
}

async function loadEvent(slug) {
  query = `query EventQuery($slug: String, $page: Int!, $perPage: Int!) {
    event(slug: $slug){
      slug
      name
      startAt
      standings(query: { page: $page, perPage: $perPage }) {
        nodes {
          standing
          entrant {
            name
            participants {
              gamerTag
              user {
                discriminator
              }
            }
          }
        }
      }
    }
  }`;
  variables = {
    "slug": slug,
    "page": 1,
    "perPage": 16
  }

  data = await queryAPI(query, variables)
  //console.log(data)
  return data.data;
}

function writeJSON(filename, obj){
  fs.writeFile(filename, JSON.stringify(obj , null , 2) , err => {
    if (err) {
      console.error(err)
      return;
    }
  })
}
