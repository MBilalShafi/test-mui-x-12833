import { Html, Head, Main, NextScript } from 'next/document';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({});

export default function Document() {
  return (
    <ThemeProvider theme={theme}>
      <Html lang="en">
        <Head />
        <body>
          {/* <Main /> */}
          <NextScript />
        </body>
      </Html>
    </ThemeProvider>
  );
}
