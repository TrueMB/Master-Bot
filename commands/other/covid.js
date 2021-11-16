const { SlashCommandBuilder } = require('@discordjs/builders');
const fetch = require('node-fetch');
const { MessageEmbed } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('covid')
    .setDescription('Displays COVID-19 stats.')
    .addStringOption(option =>
      option
        .setName('country')
        .setDescription(
          'Welches Land möchtest du sehen? Tippe `all` um die Weltweiten Stats zu sehen.'
        )
        .setRequired(true)
    ),
  async execute(interaction) {
    const country = interaction.options.get('country').value;
    if (country === 'all' || country === 'world' || country === 'global') {
      await getWorldStats()
        .then(data => {
          const covidall = new MessageEmbed()
            .setTitle('Weltweite Stats')
            .setColor('RANDOM')
            .setThumbnail('https://i.imgur.com/a4014ev.png') // World Globe image
            .addField('Total cases', data.cases.toLocaleString(), true)
            .addField('Cases today', data.todayCases.toLocaleString(), true)
            .addField('Deaths today', data.todayDeaths.toLocaleString(), true)
            .addField(
              'Aktive Fälle',
              `${data.active.toLocaleString()} (${(
                (data.active / data.cases) *
                100
              ).toFixed(2)}%)`,
              true
            )
            .addField(
              'Genesen Insgesamt',
              `${data.recovered.toLocaleString()} (${(
                (data.recovered / data.cases) *
                100
              ).toFixed(2)}%)`,
              true
            )
            .addField(
              'Tode Insgesamt',
              `${data.deaths.toLocaleString()} (${(
                (data.deaths / data.cases) *
                100
              ).toFixed(2)}%)`,
              true
            )
            .addField('Tests', `${data.tests.toLocaleString()}`, true)
            .addField(
              'Fälle pro Mil',
              `${data.casesPerOneMillion.toLocaleString()}`,
              true
            )
            .addField(
              'Tode Pro Mil',
              `${data.deathsPerOneMillion.toLocaleString()}`,
              true
            )
            .addField(
              'Öffentlicher Hinweis',
              '[Click here](https://www.who.int/emergencies/diseases/novel-coronavirus-2019/advice-for-public)'
            )
            .setFooter('Last updated')
            .setTimestamp(data.updated);

          interaction.reply({ embeds: [covidall] });
        })
        .catch(function onError(err) {
          console.error(err);
          interaction.reply('Es ist etwas schief gelaufen!');
        });
    } else {
      await getCountryStats(country)
        .then(data => {
          const covidcountry = new MessageEmbed()
            .setTitle(`Country Stats for ${data.country}`)
            .setColor('RANDOM')
            .setThumbnail(data.countryInfo.flag)
            .addField('Fälle Insgesamt', data.cases.toLocaleString(), true)
            .addField('Fälle Heute', data.todayCases.toLocaleString(), true)
            .addField('Tode Heute', data.todayDeaths.toLocaleString(), true)
            .addField(
              'Aktive Fälle',
              `${data.active.toLocaleString()} (${(
                (data.active / data.cases) *
                100
              ).toFixed(2)}%)`,
              true
            )
            .addField(
              'Genesen Insgesamt',
              `${data.recovered.toLocaleString()} (${(
                (data.recovered / data.cases) *
                100
              ).toFixed(2)}%)`,
              true
            )
            .addField(
              'Tode Insgesamt',
              `${data.deaths.toLocaleString()} (${(
                (data.deaths / data.cases) *
                100
              ).toFixed(2)}%)`,
              true
            )
            .addField('Tests', `${data.tests.toLocaleString()}`, true)
            .addField(
              'Fälle Pro Mil',
              `${data.casesPerOneMillion.toLocaleString()}`,
              true
            )
            .addField(
              'Tode Pro Mil',
              `${data.deathsPerOneMillion.toLocaleString()}`,
              true
            )
            .addField(
              'Öffentlicher Hinweis',
              '[Click here](https://www.who.int/emergencies/diseases/novel-coronavirus-2019/advice-for-public)'
            )
            .setFooter('Last updated')
            .setTimestamp(data.updated);

          interaction.reply({ embeds: [covidcountry] });
        })
        .catch(function onError(err) {
          console.error(err);
          interaction.reply('Es ist etwas schief gelaufen!');
        });
    }
    function getWorldStats() {
      return new Promise(async function(resolve, reject) {
        const url = 'https://disease.sh/v3/covid-19/all';
        try {
          const body = await fetch(url);
          if (body.status !== 200) {
            reject(
              `Konnte aktuell nicht auf die API zugreifen. Bitte versuche es später erneut.`
            );
          }
          const data = await body.json();
          resolve(data);
        } catch (e) {
          console.error(e);
          reject(
              `Konnte aktuell nicht auf die API zugreifen. Bitte versuche es später erneut.`
          );
        }
      });
    }
    function getCountryStats(country) {
      return new Promise(async function(resolve, reject) {
        const url = `https://disease.sh/v3/covid-19/countries/${country}`;
        try {
          const body = await fetch(url);
          if (body.status !== 200) {
            reject(
              `Es gab ein Problem mit der API. Hast du ein existierendes Land eingegeben?`
            );
          }
          const data = await body.json();
          resolve(data);
        } catch (e) {
          console.error(e);
          reject(
              `Es gab ein Problem mit der API. Hast du ein existierendes Land eingegeben?`
          );
        }
      });
    }
  }
};
