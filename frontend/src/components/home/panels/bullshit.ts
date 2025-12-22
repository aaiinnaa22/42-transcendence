					disabled={hasActiveInvite} onClick={onSendInvite}>
				<p className="text-xs text-left">{!hasActiveInvite ? `Invite ${friend.username} to a game` : "You have a pending game invite"}</p>
				<div className="!text-xl lg:!text-3xl material-symbols-outlined">
				sports_esports</div>
				</button>
			</div>

      {/* Messages */}
      <div className="flex flex-col gap-3 p-3 overflow-y-auto flex-grow min-h-0">
        {messages.map(msg => {
          if (msg.type !== "invite") {
            return (
              <div
                key={msg.id}
                className={
                  "p-3 rounded-lg max-w-[70%] bg-white " +
                  (msg.sender === "me" ? "self-end" : "self-start")
                }
              >
                <p className="break-words text-xs lg:text-md">{msg.text}</p>
              </div>
            );
          }
          const invite = msg.invite!;

          const status: "pending" | "expired" | "joined" =
            invite.status === "joined"
              ? "joined"
              : invite.expiresAt <= now
              ? "expired"
              : "pending";



//========================== MY BRANCH =============================

			{/* Input bar */}
			<div className="p-4">
				<form onSubmit={handleMessageSubmit} className="flex gap-2 w-full justify-center">
				<div className="bg-white rounded-lg border min-h-8 max-h-40 overflow-y-auto w-[70%] xl:w-full text-xs lg:text-md">
					<textarea
					ref={textAreaRef}
					value={message}
					onChange={handleMessageInput}
					onKeyDown={handleMessageSubmit}
					placeholder={} //placeholder changes when friend isnt online and u cant chat?
					rows={1}
					className="focus:outline-none w-full resize-none p-2"
					disabled={!friend.online}
					/>
				</div>
				<button type="submit" className="material-symbols-outlined self-end"
					disabled={!friend.online}>{t("chat.send")}</button>
				</form>
			</div>
