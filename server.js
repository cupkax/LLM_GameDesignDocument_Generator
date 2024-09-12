/*
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

const express = require('express');
const bodyParser = require('body-parser');
const { spawn } = require('child_process');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

app.post('/generate', (req, res) => {
    const { gddData } = req.body;

    let prompt = "Generate a detailed Game Design Document based on the following structure and keywords:\n\n";

    for (const [section, keywords] of Object.entries(gddData)) {
        prompt += `${section.toUpperCase()}:\n`;
        keywords.forEach(item => {
            prompt += `- ${item.keyword}`;
            if (item.description) {
                prompt += `: ${item.description}`;
            }
            prompt += '\n';
        });
        prompt += '\n';
    }

    prompt += "Expand on each section, providing detailed explanations and suggestions based on the given keywords.";

    console.log("Prompt sent to Ollama:", prompt);

    const ollama = spawn('ollama', ['run', 'mistral-nemo'], { stdio: ['pipe', 'pipe', 'pipe'] });

    ollama.stdin.write(prompt);
    ollama.stdin.end();

    res.writeHead(200, {
        'Content-Type': 'text/plain',
        'Transfer-Encoding': 'chunked'
    });

    ollama.stdout.on('data', (data) => {
        res.write(data);
    });

    ollama.stderr.on('data', (data) => {
        console.error(`Ollama stderr: ${data}`);
    });

    ollama.on('close', (code) => {
        console.log(`Ollama process exited with code ${code}`);
        res.end();
    });

    ollama.on('error', (error) => {
        console.error(`Error spawning Ollama: ${error}`);
        res.status(500).end('Failed to generate GDD');
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
