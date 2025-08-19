# Chat Widget Usage

This guide shows how to integrate the chat widget into your website.

## Option 1: Legacy Embed Script (Recommended)

The simplest way to add the chat widget to your website. This method automatically loads all dependencies and provides a clean API.

```html
<!-- Include the embed script -->
<script src="https://yourdomain.com/embed.js"></script>

<!-- Initialize the widget -->
<script>
  ChatWidget.init({
    apiUrl: 'https://your-api.com/graphql',
    publicKey: 'your-public-key'
  });
</script>
```

**Benefits:**
- Automatic CSS and dependency loading
- Simple, clean API
- Backward compatibility
- Works in all browsers

## Option 2: Direct UMD Usage

For more control over loading and initialization, you can use the UMD bundle directly.

```html
<!-- Load CSS first -->
<link rel="stylesheet" href="https://yourdomain.com/assets/chat-DJ4jq4BM.css">

<!-- Load the UMD bundle -->
<script src="https://yourdomain.com/chat-widget.umd.js"></script>

<!-- Initialize the widget -->
<script>
  ChatWidget.initChatWidget({
    publicKey: 'your-public-key',
    graphqlHttpUrl: 'https://your-api.com/graphql'
  });
</script>
```

**Benefits:**
- Full control over loading order
- Better for performance-critical applications
- Can customize CSS loading
- Smaller initial payload

## Configuration Options

Both methods support additional configuration options:

```javascript
ChatWidget.init({
  apiUrl: 'https://your-api.com/graphql',        // Required
  publicKey: 'your-public-key',                  // Required
  position: 'bottom-right',                      // Optional: bottom-right, bottom-left, top-right, top-left
  containerId: 'my-chat-container'               // Optional: embed in specific container
});
```

## Widget Positioning

The widget can be positioned in different corners:

- `bottom-right` (default)
- `bottom-left` 
- `top-right`
- `top-left`

## Inline Embedding

To embed the widget in a specific container instead of floating:

```html
<div id="my-chat-container"></div>

<script src="https://yourdomain.com/embed.js"></script>
<script>
  ChatWidget.init({
    containerId: 'my-chat-container',
    apiUrl: 'https://your-api.com/graphql',
    publicKey: 'your-public-key'
  });
</script>
```

