# Chat Widget Embedding Guide

This guide explains how to embed the chat widget into your website after the Vite migration.

## Build Output

After running `npm run build`, you'll find these files in the `dist/` directory:

- `chat-widget.umd.js` - UMD build for browser globals
- `chat-widget.es.js` - ES module build for modern bundlers
- `assets/chat-[hash].css` - Stylesheet (hash changes with content)
- Source maps for debugging

## Embedding Options

### Option 1: UMD Build (Recommended)

This is the easiest way to embed the widget. It works in all browsers and doesn't require a build system.

```html
<!DOCTYPE html>
<html>
<head>
    <!-- Load the CSS -->
    <link rel="stylesheet" href="https://your-cdn.com/assets/chat-DJ4jq4BM.css">
</head>
<body>
    <!-- Your website content -->
    
    <!-- Load the widget script -->
    <script src="https://your-cdn.com/chat-widget.umd.js"></script>
    <script>
        // Initialize the widget
        ChatWidget.initChatWidget({
            publicKey: 'your-public-key-here',
            graphqlHttpUrl: 'https://your-api.com/graphql',
            graphqlWsUrl: 'wss://your-api.com/graphql',
            // Optional: specify container ID, otherwise creates floating widget
            containerId: 'chat-widget-container',
            // Optional: additional configuration
            defaultContractId: 'your-contract-id',
            companyLogoUrl: 'https://your-logo-url.com/logo.png',
            apiUrl: 'https://your-api.com',
            ipifyUrl: 'https://api.ipify.org?format=json'
        });
    </script>
</body>
</html>
```

### Option 2: ES Module Build

For modern applications using ES modules:

```html
<script type="module">
    import { initChatWidget } from 'https://your-cdn.com/chat-widget.es.js';
    
    initChatWidget({
        publicKey: 'your-public-key-here',
        graphqlHttpUrl: 'https://your-api.com/graphql',
        graphqlWsUrl: 'wss://your-api.com/graphql'
    });
</script>
```

### Option 3: Legacy Embed Script

Use the provided `embed.js` for backward compatibility:

```html
<script src="https://your-cdn.com/embed.js"></script>
<script>
    ChatWidget.init({
        apiUrl: 'https://your-api.com/graphql',
        publicKey: 'your-public-key-here'
    });
</script>
```

## Configuration Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `publicKey` | string | Yes | Your public API key |
| `graphqlHttpUrl` | string | Yes | GraphQL HTTP endpoint |
| `graphqlWsUrl` | string | Yes | GraphQL WebSocket endpoint |
| `containerId` | string | No | DOM element ID to render widget in |
| `defaultContractId` | string | No | Default contract ID |
| `companyLogoUrl` | string | No | URL to your company logo |
| `apiUrl` | string | No | Base API URL |
| `ipifyUrl` | string | No | IP detection service URL |

## Widget Positioning

### Floating Widget (Default)

If no `containerId` is specified, the widget creates a floating chat button:

```javascript
ChatWidget.initChatWidget({
    publicKey: 'your-key',
    graphqlHttpUrl: 'https://your-api.com/graphql',
    graphqlWsUrl: 'wss://your-api.com/graphql'
    // No containerId = floating widget
});
```

### Inline Widget

To embed the widget in a specific container:

```html
<div id="my-chat-container" style="width: 400px; height: 600px;"></div>

<script>
    ChatWidget.initChatWidget({
        containerId: 'my-chat-container',
        publicKey: 'your-key',
        graphqlHttpUrl: 'https://your-api.com/graphql',
        graphqlWsUrl: 'wss://your-api.com/graphql'
    });
</script>
```

## CSS Scoping

The widget CSS is automatically scoped with `.chat-widget` prefix to prevent conflicts with your site's styles.

## Bundle Sizes

- UMD build: ~460KB (141KB gzipped)
- ES build: ~951KB (214KB gzipped)
- CSS: ~16KB (3.7KB gzipped)

## Browser Support

- Modern browsers (ES2015+)
- Chrome 51+
- Firefox 54+
- Safari 10+
- Edge 15+

## Development vs Production

### Development
```bash
npm start  # Runs on http://localhost:3006
```

### Production Build
```bash
npm run build  # Creates optimized bundles in dist/
```

## Troubleshooting

### Widget Not Loading
1. Check browser console for errors
2. Verify all URLs are correct and accessible
3. Ensure CORS is configured on your API

### Styling Conflicts
- All widget styles are scoped with `.chat-widget`
- If conflicts occur, increase CSS specificity or use `!important`

### WebSocket Connection Issues
- Ensure WebSocket URL uses `wss://` for HTTPS sites
- Check firewall/proxy settings

## Example Integration

See `public/embed-example.html` for a complete working example.

## Migration from Create React App

If migrating from the old CRA build:

1. Replace `static/js/main.js` with `chat-widget.umd.js`
2. Replace `static/css/main.css` with `assets/chat-[hash].css`
3. Update initialization code to use `ChatWidget.initChatWidget()`
4. Update environment variable names if needed

## Support

For integration support, please check:
1. Browser console for error messages
2. Network tab for failed requests
3. This documentation for configuration options