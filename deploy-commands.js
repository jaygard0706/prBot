const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId, guildId, token } = require('./config.json');

const commands = [
	new SlashCommandBuilder()
		.setName('set_region')
		.setDescription('Sets a new or existing region to a channel')
		.addStringOption(option =>
      option.setName(`region`)
        .setDescription(`region to set`)
        .setRequired(true))
		.addChannelOption(option =>
      option.setName(`channel`)
        .setDescription(`channel to bind to`)
        .setRequired(true)) ,
	new SlashCommandBuilder()
		.setName('remove_region')
		.setDescription('Removes an existing region from the bot')
		.addStringOption(option =>
      option.setName(`region`)
        .setDescription(`region to remove`)
        .setRequired(true)) ,
	new SlashCommandBuilder()
		.setName('add_event_to_region')
		.setDescription('Adds a smash.gg event to a region')
		.addStringOption(option =>
      option.setName(`region`)
        .setDescription(`region to add to`)
        .setRequired(true))
		.addStringOption(option =>
      option.setName(`event_slug`)
        .setDescription(`part of the event smash.gg link with the format \"tournament/tourn-name/event/event-name\"`)
        .setRequired(true))
		.addNumberOption(option =>
      option.setName(`event_type`)
        .setDescription(`Major or Minor tournament, relevant for calculating PRs`)
				.addChoice('Major' , 1)
				.addChoice('Minor' , 0.5)
        .setRequired(true)) ,
	new SlashCommandBuilder()
		.setName('remove_event_from_region')
		.setDescription('Removes a smash.gg event from a region')
		.addStringOption(option =>
      option.setName(`region`)
        .setDescription(`region to remove from`)
        .setRequired(true))
		.addStringOption(option =>
      option.setName(`event_slug`)
        .setDescription(`part of the event smash.gg link with the format \"tournament/tourn-name/event/event-name\"`)
        .setRequired(true)) ,
	new SlashCommandBuilder()
		.setName('update_prs')
		.setDescription('Gets new tournament info if PRs were lasted updated when a tourney was incomplete') ,
	new SlashCommandBuilder()
		.setName('get_points')
		.setDescription('Displays the points of a player')
		.addStringOption(option =>
      option.setName(`player`)
        .setDescription(`start.gg name of a player`)
        .setRequired(true))
		.addStringOption(option =>
      option.setName(`show_stats`)
        .setDescription(`show extra stats`)
				.addChoice('Show' , `Show`)
				.addChoice('Dont Show' , `Dont`)
        .setRequired(false)) ,
]
	.map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(token);

rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error);
