#!/usr/bin/env python3
"""
TikTok Live Chat Moderator

This script monitors TikTok live streams and provides moderation capabilities,
including content analysis via OpenAI's GPT models.
"""


## Todo :
# - Ajouter ollama


import argparse
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime

from TikTokLive import TikTokLiveClient
from TikTokLive.events import ConnectEvent, CommentEvent
import pync  # macOS notifications
from openai import OpenAI
import pyperclip
import pyautogui
import time

# OpenAI Client initialization
try:
    gpt_client = OpenAI()
except Exception as e:
    print(f"Failed to initialize OpenAI client: {e}")
    raise

# Prompt templates
SYSTEM_PROMPT_READER = """Vous êtes un assistant qui peut aider avec le chat en direct TikTok.
Vous recevrez des commentaires du chat provenant du canal en direct. Pour chaque nouvelle mise à jour du chat, vous direz les nouveaux commentaires.
Pour le nom d'utilisateur, assurez-vous de le dire d'une façon facile à prononcer.
Pour les smileys ou les emojis, prononce les simplement. un seul par message, sinon, c'est trop long.
ne dis pas plusieurs emojis par messages. c'est trop long.
Si il y a des fautes d'orthographe ou des fautes des frappes dans le message, corrige les dans ta réponse.
"""

SYSTEM_PROMPT_RESPONDER = """Vous êtes un assistant qui réponds au chat en direct TikTok.
Vous recevrez des commentaires du chat provenant du canal en direct. Pour chaque nouvelle mise à jour du chat, vous repondrez.
Pour le nom d'utilisateur, assurez-vous de le dire d'une façon facile à prononcer.
Pour les smileys ou les emojis, prononce les simplement. un seul par message, sinon, c'est trop long.
ne dis pas plusieurs emojis par messages. c'est trop long.
Si il y a des fautes d'orthographe ou des fautes des frappes dans le message, corrige les dans ta réponse.
Si le commentaire est une question, tu réponds par une phrase courte et concise.
Si le commentaire est faux, contredit le.
Essaye de reconnaitre le sarcasme et la critique des religions.
La critique de la religion est une bonne chose.
Tu critique allegrement les religions, pas les religieux.
Defends la declaration universelle des droits de l'homme, le progressisme.
Tu combats les discriminations, les racismes, les sexismes, les agissements de nature homophobe, transphobe, etc.
"""




class TikTokModerator:
    """TikTok live chat moderation class."""
    
    def __init__(self, channel: str, max_comments_history: int = 10):
        """
        Initialize the TikTok moderator.
        
        Args:
            channel: TikTok channel to monitor
            max_comments_history: Maximum number of comments to store in history
        """
        self.channel = self._format_channel(channel)
        self.max_comments_history = max_comments_history
        self.all_comments = []
        self.all_allPersons = []
        self.is_first_comment = True
        self.client = TikTokLiveClient(unique_id=self.channel)
        
        # Register event handlers
        self.client.add_listener(ConnectEvent, self.on_connect)
        self.client.add_listener(CommentEvent, self.on_comment)
        
        print(f"Moderator initialized for channel: {self.channel}")
    
    @staticmethod
    def _format_channel(channel: str) -> str:
        """Ensure channel name starts with @."""
        return channel if channel.startswith('@') else f'@{channel}'
    
    @staticmethod
    def _get_timestamp():
        """Return current timestamp for logging."""
        return datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    async def on_connect(self, event: ConnectEvent) -> None:
        """Handle connection event."""
        timestamp = self._get_timestamp()
        print(f"[{timestamp}] Connected to @{event.unique_id} (Room ID: {event.room_id})")
        
        # Display a test notification on startup
        notification_title = "TikTok Moderator - Connected"
        notification_message = f"Successfully connected to {self.channel}\nReady to monitor comments"
        self._send_notification(notification_message, notification_title)
    
    async def on_comment(self, event: CommentEvent) -> None:
        """Handle new comments."""
        username = event.user.nickname
        comment_text = event.comment
        
        timestamp = self._get_timestamp()
        
        
        # Skip processing for the first comment to avoid initial spam
        if self.is_first_comment:
            self.is_first_comment = False
            return
        
        # Add comment to history
        comment_data = {"username": username, "message": comment_text}
        self.all_comments.append(comment_data)
        
        # Maintain history size
        if len(self.all_comments) > self.max_comments_history:
            self.all_comments.pop(0)
        
        # Check comment for policy violations
        try:
            ok=self._check_comment_moderation(username, comment_text)
            if ok:
                print(f"[{timestamp}] {username} -> {comment_text}")
            else:
                print(f"[{timestamp}] {username} -> {comment_text}")
        except Exception as e:
            print(f"[ERROR] Error in moderation check: {e}")

        
        # Process direct messages to the channel owner
        if comment_text.startswith("@SamLePirate"):
            print(f"Message addressed to @SamLePirate")
            await self._process_direct_message([comment_data])
        
        # Uncomment to enable auto-responses to all comments
        else:
            if comment_data["message"].startswith("@SamLePirate") or comment_data["message"].endswith("@SamLePirate") or comment_data["message"].startswith("Gentil Robot") or comment_data["message"].endswith("Gentil Robot") :
                await self._generate_response([comment_data])
    
    def _check_comment_moderation(self, username: str, comment_text: str):
        """Check comment for policy violations using OpenAI moderation."""
        try:
            response = gpt_client.moderations.create(
                model="omni-moderation-latest",
                input=comment_text,
            )
            
            if response.results[0].flagged:
                # Extract flagged categories and their scores
                categories = response.results[0].categories
                scores = response.results[0].category_scores

                #count the number of times the username is in the list
                count = self.all_allPersons.count(username)
                if count != 0:
                    print(f"L'utilisateur {username} a dit {count} messages problematiques")

                self.all_allPersons.append(username+" "+comment_text)
                
                timestamp = self._get_timestamp()
                print(f"\033[31m{username}: {comment_text}\033[0m")  # Affichage du commentaire en rouge
                reasons = []
                
                for category in categories.__dict__:
                    if getattr(categories, category):
                        score = getattr(scores, category)
                        reasons.append(f"{category} (score: {score:.1f})")
                        print(f"  {category}: {score:.3f}")
                
                # Send notification for problematic content
                notification_title = "Message problématique détecté!"
                notification_message = (
                    f"{username}: {comment_text}\n"
                    f"Raison: {', '.join(reasons)}"
                )
                self._send_notification(notification_message, notification_title)
                print(f"\033[31m{username}: {comment_text}\033[0m")  # Affichage du commentaire en rouge
                return False
            else:
                return True
        except Exception as e:
            print(f"[ERROR] Moderation API error: {e}")
    
    async def _process_direct_message(self, comment_list: List[Dict[str, str]]) -> None:
        """Process messages directed to the channel owner."""
        try:
            user_prompt = self._format_comment_list_prompt(comment_list)
            
            completion = gpt_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT_READER},
                    {"role": "user", "content": user_prompt}
                ]
            )
            
            response = completion.choices[0].message.content
            timestamp = self._get_timestamp()
            print(f"[{timestamp}] AI response: {response}")
            
            # Skip notifications for generic acknowledgments
            if response.lower() in ["ok", "ok."]:
                return
            
            # Send notification with AI's interpretation
            self._send_notification(
                response, 
                "TikTok Moderator - New Direct Message"
            )
            
        
        except Exception as e:
            print(f"[ERROR] Error processing direct message: {e}")
    
    async def _generate_response(self, new_comments: List[Dict[str, str]]) -> None:
        """Generate AI response to comments."""
        try:
            # Format prompt with context of all previous comments
            user_prompt = "Voici les anciens commentaires du chat :\n"
            for comment in self.all_comments[:-len(new_comments)]:
                user_prompt += f"{comment['username']}: {comment['message']}\n"
            
            user_prompt += "Voici les nouveaux commentaires :\n"
            for comment in new_comments:
                user_prompt += f"{comment['username']}: {comment['message']}\n"
            
            user_prompt += "Maintenant, tu vas répondre aux nouveaux commentaires"
            
            completion = gpt_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT_RESPONDER},
                    {"role": "user", "content": user_prompt}
                ]
            )
            
            response = completion.choices[0].message.content
            
            if response.lower() not in ["ok", "ok."]:
                timestamp = self._get_timestamp()
                print(f"[{timestamp}] Suggested response: {response}")
                print(comment['username'])
                if comment['username'] != "SamLePirate":
                    #split the response by chunk of 109 characters
                    MAX_CHARS = 100
                    responses = []
                    
                    # Split response into words
                    words = response.split()
                    current_chunk = ""
                    
                    for word in words:
                        # Check if adding this word would exceed the limit
                        # Allow space for the numbering (e.g., "1/10") that will be added later
                        # Conservatively allocate 6 characters for this (up to "10/10")
                        if len(current_chunk + " " + word) <= MAX_CHARS - 6:
                            if current_chunk:
                                current_chunk += " " + word
                            else:
                                current_chunk = word
                        else:
                            # Current chunk is full, add it to responses and start a new chunk
                            responses.append(current_chunk)
                            current_chunk = word
                    
                    # Add the last chunk if it's not empty
                    if current_chunk:
                        responses.append(current_chunk)
                    
                    print(responses)
                    lReponse = len(responses)
                    j=0
                    for i in responses:
                        j=j+1
                        pyperclip.copy(i+str(j)+"/"+str(lReponse))
                        pyautogui.hotkey('command', 'v')
                        pyautogui.press('enter')
                        time.sleep(1.5)
        
        except Exception as e:
            print(f"[ERROR] Error generating response: {e}")
    
    @staticmethod
    def _format_comment_list_prompt(comment_list: List[Dict[str, str]]) -> str:
        """Format comments into a prompt string."""
        prompt = ""
        for comment in comment_list:
            prompt += f"{comment['username']}: {comment['message']}\n"
        prompt += "Maintenant, tu vas dire les nouveaux commentaires."
        return prompt
    
    @staticmethod
    def _send_notification(message: str, title: str, sound: str = "Ping") -> None:
        """Send a macOS notification."""
        try:
            pync.notify(
                message, 
                title=title, 
                sound=sound, 
                appIcon="", 
                contentImage="",
                activate="com.apple.Terminal"
            )
        except Exception as e:
            print(f"[ERROR] Failed to send notification: {e}")
    
    def run(self) -> None:
        """Run the TikTok live client."""
        try:
            print(f"Starting moderation for channel: {self.channel}")
            self.client.run()
        except KeyboardInterrupt:
            print("Moderator stopped by user")
        except Exception as e:
            print(f"[ERROR] Error running TikTok client: {e}")


def parse_arguments() -> argparse.Namespace:
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="TikTok Live Chat Moderator")
    parser.add_argument(
        '--channel', 
        type=str, 
        required=True, 
        help='TikTok channel to monitor (e.g. @username)'
    )
    parser.add_argument(
        '--history-size',
        type=int,
        default=10,
        help='Number of comments to keep in history (default: 10)'
    )
    return parser.parse_args()


def main() -> None:
    """Main entry point for the script."""
    # Parse command line arguments
    args = parse_arguments()
    
    # Create and run the moderator
    moderator = TikTokModerator(
        channel=args.channel,
        max_comments_history=args.history_size
    )
    moderator.run()


if __name__ == '__main__':
    main()