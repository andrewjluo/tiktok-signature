const Signer = require("./index");
const Signature = require("./Signature")
const http = require("http");
var rp = require("request-promise");

let OLD_SIGNER_ON = true

let userAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) " +
  "AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1";

function sign(url) {
  let signingFunc = Signature.sign(userAgent)
  return signingFunc({ url })
}

(async function main() {
  try {
    let signer = undefined
    if (OLD_SIGNER_ON) {
      signer = new Signer();
    }

    const server = http
      .createServer()
      // .listen(8080, "127.0.0.1")
      .listen(process.env.PORT || 8080)
      .on("listening", function() {
        console.log("TikTok Signature server started");
      });

    if (OLD_SIGNER_ON) {
    // Uncomment if you want to auto-exit this application after a period of time
    // Supervisord will attempt to re-open it if are used
    // setTimeout(function () {
    //   server.close(() => {
    //     console.log("Server shutdown completed.");
    //     process.exit(1);
    //   });
    // }, 1 * 60 * 60 * 1000);

      signer.init(); // !?
    }

    server.on("request", (request, response) => {
      if (request.method === "POST" && request.url === "/signature") {
        var url = "";
        request.on("data", function (chunk) {
          url += chunk;
        });

        request.on("end", async function () {
          console.log("Received url: " + url);

          try {
            let token = undefined
            if (OLD_SIGNER_ON) {
              const verifyFp = await signer.getVerifyFp();
              token = await signer.sign(url);
              let output = JSON.stringify({
                signature: token,
                verifyFp: verifyFp,
              });
              response.writeHead(200, { "Content-Type": "application/json" });
              response.end(output);
              console.log("Sent result: " + output);
            }
            else {
              token = sign(url)
              response.writeHead(200);
              response.end(token);
              console.log("Sent signature: " + token);
            }
          } catch (err) {
            console.log(err);
          }
        });
      } else {
        response.statusCode = 404;
        response.end();
      }
    });

    // await signer.close();
  } catch (err) {
    console.error(err);
  }
})();
