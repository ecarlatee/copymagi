export default function Info() {
  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-8">
      <main className="w-full max-w-2xl bg-card/50 backdrop-blur-lg border rounded-3xl p-8 flex flex-col items-center gap-6 shadow-2xl">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Info</h1>
        </div>
        <div className="text-left space-y-4 text-muted-foreground">
            <p>
                This is a project I thought of in class because I wanted to paste text on my PC from my phone.
            </p>
            <p>
                I thought it might be interesting to make it work on any station, any network, etc. so I might as well put it in place if it can be useful.
            </p>
            <p>
                The site does not store any data. The transfer is done in real time and nothing is kept on the server.
            </p>
        </div>
      </main>
    </div>
  );
}
