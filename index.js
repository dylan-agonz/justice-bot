require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Función de utilidad para crear "pausas" de tiempo (Sleep)
const esperar = (ms) => new Promise(resolve => setTimeout(resolve, ms));

client.once('ready', () => {
    console.log(`✅ Bot de Sorteos listo como ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // Comando: !team o !equipo
    if (message.content.toLowerCase() === '!rula' || message.content.toLowerCase() === '!ruleta') {
        
        // 1. Validar canal de voz
        const canalVoz = message.member.voice.channel;
        if (!canalVoz) return message.reply('❌ ¡Entra al canal de voz primero!');

        // 2. Obtener jugadores (sin bots)
        let disponibles = Array.from(canalVoz.members.filter(m => !m.user.bot).values());

        if (disponibles.length < 1) return message.reply('👻 No hay nadie para jugar.');

        // CONFIGURACIÓN: ¿Cuántos entran al equipo?
        const CUPOS = 5; 
        
        // Si hay menos gente que cupos, ajustamos
        const aSeleccionar = Math.min(CUPOS, disponibles.length);

        // 3. Mensaje inicial (Lo guardamos en una variable 'msg' para editarlo luego)
        let textoActual = `🏆 **Iniciando el DRAFT para ${aSeleccionar} jugadores...**\n\n`;
        const msg = await message.channel.send(textoActual);

        // 4. Bucle de selección con suspenso
        for (let i = 1; i <= aSeleccionar; i++) {
            
            // A. Efecto de "Barajando/Girando"
            // Editamos el mensaje para mostrar que estamos buscando al siguiente
            await msg.edit(`${textoActual}⏳ *Buscando al Jugador #${i}...* 🔄`);
            
            // Pausa dramática de 1.5 segundos (Suspenso)
            await esperar(2500);

            // B. Elegir ganador al azar de la lista de disponibles
            const indiceRandom = Math.floor(Math.random() * disponibles.length);
            const elegido = disponibles[indiceRandom];

            // C. Sacarlo de la lista (para que no salga repetido)
            disponibles.splice(indiceRandom, 1);

            // D. Actualizar el texto fijo con el nuevo elegido
            textoActual += `✅ Jugador #${i}: **${elegido.user.username}**\n`;
            
            // E. Mostrar el resultado parcial
            await msg.edit(textoActual);
            
            // Pequeña pausa antes del siguiente (si quedan)
            if (i < aSeleccionar) await esperar(2000);
        }

        // 5. Mensaje final
        await msg.edit(`${textoActual}\n🔥 **Equipo listo, voten bien giles.** 🔥`);
    }
});

client.login(process.env.DISCORD_TOKEN);
// --- CÓDIGO NUEVO PARA RENDER ---
const http = require('http');
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot activo y escuchando!');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🌍 Servidor web falso escuchando en el puerto ${PORT}`);
});
// --------------------------------