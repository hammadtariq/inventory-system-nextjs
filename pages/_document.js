// pages/_document.tsx (or .js)
import Document, {
  Html,
  Head,
  Main,
  NextScript,
  DocumentContext,
} from 'next/document';
import { createCache, extractStyle, StyleProvider } from '@ant-design/cssinjs';

export default class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const cache = createCache();
    const renderPage = ctx.renderPage;

    ctx.renderPage = () =>
      renderPage({
        enhanceApp: (App) => (props) =>
          (
            <StyleProvider cache={cache}>
              <App {...props} />
            </StyleProvider>
          ),
      });

    const initialProps = await Document.getInitialProps(ctx);
    const styles = extractStyle(cache, true);

    return {
      ...initialProps,
      styles: (
        <>
          {initialProps.styles}
          <style
            // AntD CSS-in-JS SSR output
            dangerouslySetInnerHTML={{ __html: styles }}
          />
        </>
      ),
    };
  }

  render() {
    return (
      <Html lang="en">
        <Head />
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
