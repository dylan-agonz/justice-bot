require('dotenv').config();
const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');
const Canvas = require('canvas');
const path = require('path');

// --- SERVIDOR PARA RENDER (NO BORRAR) ---
const http = require('http');
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot activo y escuchando!');
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🌍 Web server listo en puerto ${PORT}`));
// ----------------------------------------

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// MEMORIA DE INMUNIDAD
let ultimoSuplenteID = null;

const esperar = (ms) => new Promise(resolve => setTimeout(resolve, ms));

client.once('ready', () => {
    console.log(`✅ Bot listo: Inmunidad + Avatares activados`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content.toLowerCase() === '!rula' || message.content.toLowerCase() === '!ruleta') {
        
        const canalVoz = message.member.voice.channel;
        if (!canalVoz) return message.reply('❌ ¡Entra al canal de voz primero!');

        // 1. OBTENER JUGADORES
        let todosEnVoz = Array.from(canalVoz.members.filter(m => !m.user.bot).values());
        
        if (todosEnVoz.length < 1) return message.reply('👻 No hay nadie para jugar.');

        const CUPOS = 5;
        let titulares = [];
        let suplentes = [];

        // 2. LÓGICA DE INMUNIDAD
        if (ultimoSuplenteID) {
            const inmuneIndex = todosEnVoz.findIndex(m => m.id === ultimoSuplenteID);
            if (inmuneIndex !== -1) {
                const jugadorInmune = todosEnVoz.splice(inmuneIndex, 1)[0];
                titulares.push(jugadorInmune);
                message.channel.send(`🛡️ **${jugadorInmune.user.username}** usa su INMUNIDAD y entra directo.`);
            }
        }

        // 3. SELECCIÓN ALEATORIA
        const huecosFaltantes = CUPOS - titulares.length;
        let msg = await message.channel.send(`🎲 Buscando a los otros ${huecosFaltantes} players...`);

        for (let i = 0; i < huecosFaltantes; i++) {
            if (todosEnVoz.length === 0) break;
            
            await esperar(2000); // 1 segundo de suspenso por jugador

            const indiceRandom = Math.floor(Math.random() * todosEnVoz.length);
            const elegido = todosEnVoz.splice(indiceRandom, 1)[0];
            titulares.push(elegido);
            
            await msg.edit(`✅ Fichado: **${elegido.user.username}**`);
        }

        // Guardar al nuevo suplente para la próxima
        suplentes = todosEnVoz;
        if (suplentes.length > 0) {
            ultimoSuplenteID = suplentes[0].id;
            await message.channel.send(`💀 **${suplentes[0].user.username}** a la banca (Inmunidad activada para la próxima).`);
        } else {
            ultimoSuplenteID = null;
        }

        // 4. GENERACIÓN DE IMAGEN CON AVATARES
        try {
            await message.channel.send("🎨 *Generando la foto del equipo...*");

            // Crear lienzo ancho (1200x400)
            const canvas = Canvas.createCanvas(1200, 400);
            const ctx = canvas.getContext('2d');

            // --- FONDO ---
            // Intenta cargar background.jpg, si no existe, usa un color sólido oscuro
            try {
                const background = await Canvas.loadImage(path.join(__dirname, 'background.jpg'));
                ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
            } catch (e) {
                ctx.fillStyle = '#23272A'; // Color Discord Oscuro
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            // Título
            ctx.font = 'bold 40px sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText('🏆 SQUAD CONFIRMADO 🏆', canvas.width / 2, 50);

            // --- BUCLE PARA DIBUJAR LOS 5 AVATARES ---
            const startX = 100; // Margen izquierdo
            const gap = 220;    // Espacio entre cada avatar
            const avatarY = 150; // Altura vertical
            const avatarSize = 150; // Tamaño del círculo (150x150)

            // Usamos un bucle 'for' asíncrono para cargar las imágenes
            for (let i = 0; i < titulares.length; i++) {
                const jugador = titulares[i];
                const x = startX + (i * gap); // Calcular posición X de este jugador

                // 1. Cargar Avatar (Forzamos formato PNG)
                const avatarURL = jugador.user.displayAvatarURL({ extension: 'png', size: 256 });
                const avatar = await Canvas.loadImage(avatarURL);

                // 2. Hacer el recorte circular (Magia de Canvas)
                ctx.save(); // Guardar estado actual
                ctx.beginPath();
                ctx.arc(x + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, true);
                ctx.closePath();
                ctx.clip(); // ¡Recortar! Todo lo que dibujemos ahora será circular
                
                ctx.drawImage(avatar, x, avatarY, avatarSize, avatarSize);
                
                ctx.restore(); // Volver al estado normal (para poder dibujar texto fuera del círculo)

                // 3. Dibujar Nombre debajo
                ctx.font = 'bold 25px sans-serif';
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                
                // Centrar texto respecto al avatar
                const textX = x + (avatarSize / 2);
                const textY = avatarY + avatarSize + 40; 
                ctx.fillText(jugador.user.username, textX, textY);
            }

            // Enviar
            const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'dream-team.png' });
            await message.channel.send({ files: [attachment] });

        } catch (error) {
            console.error(error);
            message.channel.send("⚠️ Hubo un error dibujando la imagen, pero el equipo ya está elegido.");
        }
    }
});

client.login(process.env.DISCORD_TOKEN);