import os
import sys
import json
import base64
import urllib.parse
import argparse
from PIL import Image, ImageDraw, ImageFont

def get_base64_url(payload):
    """
    Serializes a Python dict payload into a base64 string matching
    the frontend JS decodeURIComponent(atob(...)) structure.
    """
    json_str = json.dumps(payload)
    quoted = urllib.parse.quote(json_str)
    encoded = base64.b64encode(quoted.encode('utf-8')).decode('utf-8')
    return encoded

def compile_standalone_html():
    """
    Reads index.html, index.css, and app.js, and bundles them
    into a single standalone offline html file.
    """
    print("Compiling standalone HTML file...")
    
    if not os.path.exists('index.html') or not os.path.exists('index.css') or not os.path.exists('app.js'):
        print("Error: Core source files (index.html, index.css, app.js) not found in directory.")
        return False
        
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()
        
    with open('index.css', 'r', encoding='utf-8') as f:
        css = f.read()
        
    with open('app.js', 'r', encoding='utf-8') as f:
        js = f.read()
        
    # Inline CSS
    css_tag = f"<style>\n{css}\n</style>"
    html = html.replace('<link rel="stylesheet" href="index.css">', css_tag)
    
    # Inline JS
    js_tag = f"<script>\n{js}\n</script>"
    html = html.replace('<script src="app.js"></script>', js_tag)
    
    output_path = 'standalone_wish.html'
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html)
        
    print(f"Success! Standalone file written to: {os.path.abspath(output_path)}")
    return True

def generate_physical_card(name, age, sender, message, theme, wish_url):
    """
    Uses Pillow to draw a beautiful high-resolution printable card (800x1200)
    complete with custom gradients, typography, and a generated QR code.
    """
    print(f"Generating physical greeting card image for {name}...")
    
    try:
        import qrcode
    except ImportError:
        print("Error: 'qrcode' library is required to generate the QR code. Install via: pip install qrcode")
        return False
        
    # Dimensions (Portrait greeting card)
    width = 800
    height = 1200
    card = Image.new('RGB', (width, height), color='#ffffff')
    draw = ImageDraw.Draw(card)
    
    # Setup fonts
    font_bold_path = r"C:\Windows\Fonts\georgiab.ttf"
    font_reg_path = r"C:\Windows\Fonts\georgia.ttf"
    font_sans_path = r"C:\Windows\Fonts\arial.ttf"
    
    if not os.path.exists(font_bold_path):
        font_bold_path = r"C:\Windows\Fonts\arialbd.ttf"
        font_reg_path = r"C:\Windows\Fonts\arial.ttf"
        
    try:
        font_title = ImageFont.truetype(font_bold_path, 48)
        font_subtitle = ImageFont.truetype(font_reg_path, 28)
        font_message = ImageFont.truetype(font_reg_path, 22)
        font_footer = ImageFont.truetype(font_sans_path, 16)
        font_qr_label = ImageFont.truetype(font_sans_path, 18)
    except Exception:
        font_title = ImageFont.load_default()
        font_subtitle = ImageFont.load_default()
        font_message = ImageFont.load_default()
        font_footer = ImageFont.load_default()
        font_qr_label = ImageFont.load_default()
        print("Warning: System fonts failed to load. Falling back to default bitmap font.")

    # Apply themed backgrounds & borders
    if theme == 'rose':
        bg_color = "#051c14"
        accent_color = "#e8a2a8" # rose gold
        text_color = "#f5ebd9"
        border_color = "#d4af37" # gold
        
        draw.rectangle([0, 0, width, height], fill=bg_color)
        draw.rectangle([25, 25, width-25, height-25], outline=border_color, width=4)
        draw.rectangle([35, 35, width-35, height-35], outline=border_color, width=1)
    else:
        bg_color = "#0b071e" # cosmic dark background
        accent_color = "#ec4899" # neon pink
        text_color = "#e5e0ff" # neon off-white
        border_color = "#a855f7" # neon purple
        
        draw.rectangle([0, 0, width, height], fill=bg_color)
        draw.rectangle([25, 25, width-25, height-25], outline=border_color, width=4)
        draw.rectangle([35, 35, width-35, height-35], outline="#ffffff", width=1)
        
    # Draw Heading Text
    title_text = "HAPPY BIRTHDAY!"
    title_w = draw.textlength(title_text, font=font_title)
    draw.text(((width - title_w) / 2, 80), title_text, fill=accent_color, font=font_title)
    
    # Subheading
    sub_text = f"Dear {name}" + (f", Age {age}" if age else "")
    sub_w = draw.textlength(sub_text, font=font_subtitle)
    draw.text(((width - sub_w) / 2, 170), sub_text, fill=text_color, font=font_subtitle)
    
    # Ribbon ornament drawing
    line_y = 230
    draw.line([(width//2 - 120), line_y, (width//2 + 120), line_y], fill=accent_color, width=2)
    
    # Message Body
    margin = 80
    max_w = width - (margin * 2)
    current_y = 280
    
    paragraphs = message.split('\n')
    for paragraph in paragraphs:
        words = paragraph.split(' ')
        line = ""
        for word in words:
            test_line = line + word + " "
            test_w = draw.textlength(test_line, font=font_message)
            if test_w > max_w:
                draw.text((margin, current_y), line, fill=text_color, font=font_message)
                current_y += 35
                line = word + " "
            else:
                line = test_line
        
        if line:
            draw.text((margin, current_y), line, fill=text_color, font=font_message)
            current_y += 35
        current_y += 15

    # Draw Sender Sign-off
    sig_text = f"— From {sender}"
    sig_w = draw.textlength(sig_text, font=font_subtitle)
    draw.text((width - margin - sig_w, current_y + 10), sig_text, fill=accent_color, font=font_subtitle)
    
    # Generate QR Code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=4,
        border=2,
    )
    qr.add_data(wish_url)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color=text_color, back_color=bg_color)
    
    qr_size = 180
    qr_img = qr_img.resize((qr_size, qr_size))
    
    qr_x = (width - qr_size) // 2
    qr_y = height - 290
    card.paste(qr_img, (qr_x, qr_y))
    
    qr_label = "Scan to open your interactive surprise!"
    qr_label_w = draw.textlength(qr_label, font=font_qr_label)
    draw.text(((width - qr_label_w) / 2, qr_y + qr_size + 15), qr_label, fill=accent_color, font=font_qr_label)
    
    footer_text = "Made with Celebration Spark"
    footer_w = draw.textlength(footer_text, font=font_footer)
    draw.text(((width - footer_w) / 2, height - 55), footer_text, fill=accent_color if theme == 'cosmic' else text_color, font=font_footer)
    
    output_img_path = 'birthday_card.png'
    card.save(output_img_path)
    print(f"Success! Physical card graphic written to: {os.path.abspath(output_img_path)}")
    return True

def main():
    parser = argparse.ArgumentParser(description="Magical Birthday Wish Compiler & Graphic Card Generator")
    parser.add_argument('--name', default="Nancy", help="Recipient name")
    parser.add_argument('--age', default="", help="Recipient age (optional)")
    parser.add_argument('--sender', default="Your Friend", help="Sender name")
    parser.add_argument('--theme', default="cosmic", choices=["cosmic", "rose"], help="Theme selection")
    parser.add_argument('--message', default="", help="Poetic custom greeting message")
    parser.add_argument('--balloons', default="", help="Comma-separated list of 5 memory strings")
    parser.add_argument('--fortunes', default="", help="Comma-separated list of 3 fortune blessings")
    parser.add_argument('--standalone', action='store_true', help="Compile standalone offline HTML file")
    parser.add_argument('--card', action='store_true', help="Generate PNG physical card image with QR code")
    
    args = parser.parse_args()
    
    message = args.message
    if not message:
        message = (
            f"On this special day, may your heart be as light as a balloon, "
            f"your smile as bright as a candle's flame, and your future as sparkling as a shooting star.\n\n"
            f"You bring so much light and joy into the lives of everyone around you. Here's to celebrating "
            f"the wonderful person you are, and to all the beautiful memories yet to be made!\n\n"
            f"Happy Birthday!"
        )
        
    balloons_list = []
    if args.balloons:
        balloons_list = [b.strip() for b in args.balloons.split(',') if b.strip()]
    else:
        balloons_list = [
            "Your infectious, happy laughter",
            "Late night talks and endless support",
            "Always bringing positive energy",
            "Being an incredibly kind human",
            "Inspiring everyone around you"
        ]
        
    fortunes_list = []
    if args.fortunes:
        fortunes_list = [f.strip() for f in args.fortunes.split(',') if f.strip()]
    else:
        fortunes_list = [
            "A year of incredible adventures is waiting for you!",
            "Your laughter will light up every room you enter!",
            "A wonderful, unexpected success is heading your way!"
        ]
        
    # Build shareable URL payload
    payload = {
        "name": args.name,
        "age": args.age,
        "sender": args.sender,
        "message": message,
        "memories": balloons_list[:5],
        "fortunes": fortunes_list[:3],
        "defaultTheme": args.theme
    }
    
    encoded = get_base64_url(payload)
    wishing_url = f"https://wishing-surprise.github.io/happy-birthday/?wish={encoded}"
    
    print("\n--- Spark Celebration Generator ---\n")
    print(f"Recipient:  {args.name}")
    if args.age:
        print(f"Age:        {args.age}")
    print(f"Sender:     {args.sender}")
    print(f"Theme:      {args.theme}")
    print(f"Custom URL Payload created successfully!")
    print(f"Shareable Link:\n{wishing_url}\n")
    
    compiled_ok = True
    if args.standalone or (not args.standalone and not args.card):
        compiled_ok = compile_standalone_html()
        
    card_ok = True
    if args.card or (not args.standalone and not args.card):
        card_ok = generate_physical_card(
            name=args.name,
            age=args.age,
            sender=args.sender,
            message=message,
            theme=args.theme,
            wish_url=wishing_url
        )

if __name__ == '__main__':
    main()
