const path = require("path");
const fs = require("fs");
const fastify = require("fastify")({ logger: false });

// Setup our static files
fastify.register(require("@fastify/static"), {
  root: path.join(__dirname, "public"),
  prefix: "/",
});

// ---- 회원 정보 API 코드 ----

// 모든 임시 회원 정보를 가져오는 API
fastify.get("/api/pendingMembers", (request, reply) => {
  fs.readFile("./data.json", "utf8", (err, data) => {
    if (err) {
      console.error(err);
      return reply.status(500).send("파일 읽기 오류");
    }
    const pendingMembers = JSON.parse(data).pendingMembers;
    reply.send(pendingMembers);
  });
});

// 특정 임시 회원 정보를 가져오는 API
fastify.get("/api/pendingMembers/:id", (request, reply) => {
  fs.readFile("./data.json", "utf8", (err, data) => {
    if (err) {
      console.error(err);
      return reply.status(500).send("파일 읽기 오류");
    }
    const pendingMembers = JSON.parse(data).pendingMembers;
    const member = pendingMembers.find(m => m.id === parseInt(request.params.id));
    if (!member) return reply.status(404).send("임시 회원 정보를 찾을 수 없습니다.");
    reply.send(member);
  });
});

// 새로운 회원을 추가하는 API
fastify.post("/api/members", (request, reply) => {
  const newMember = request.body; // 요청 본문에서 회원 정보를 가져옵니다.

  fs.readFile("./data.json", "utf8", (err, data) => {
    if (err) {
      console.error(err);
      return reply.status(500).send("파일 읽기 오류");
    }

    const { pendingMembers } = JSON.parse(data);
    newMember.id = pendingMembers.length + 1; // 새로운 ID 부여
    pendingMembers.push(newMember); // 새로운 임시 회원 추가

    fs.writeFile("./data.json", JSON.stringify({ pendingMembers }, null, 2), (err) => {
      if (err) {
        console.error(err);
        return reply.status(500).send("파일 쓰기 오류");
      }
      reply.status(201).send(newMember); // 성공적으로 추가된 회원 정보 반환
    });
  });
});

// 회원 승인 API
fastify.post("/api/approve/:id", (request, reply) => {
  const memberId = parseInt(request.params.id);

  fs.readFile("./data.json", "utf8", (err, data) => {
    if (err) {
      console.error(err);
      return reply.status(500).send("파일 읽기 오류");
    }
    
    const jsonData = JSON.parse(data);
    const pendingMembers = jsonData.pendingMembers;
    const approvedMembers = jsonData.approvedMembers;

    const memberIndex = pendingMembers.findIndex(m => m.id === memberId);
    if (memberIndex === -1) return reply.status(404).send("임시 회원을 찾을 수 없습니다.");
    
    const approvedMember = { ...pendingMembers[memberIndex], shares: 0, pricePerShare: 0 }; // 보유 수량 및 가격 초기화
    approvedMembers.push(approvedMember); // 승인된 회원 추가
    pendingMembers.splice(memberIndex, 1); // 임시 회원 목록에서 제거

    fs.writeFile("./data.json", JSON.stringify({ pendingMembers, approvedMembers }, null, 2), (err) => {
      if (err) {
        console.error(err);
        return reply.status(500).send("파일 쓰기 오류");
      }
      reply.status(200).send(approvedMember); // 승인된 회원 정보 반환
    });
  });
});

// 특정 승인된 회원 정보를 가져오는 API
fastify.get("/api/approvedMembers/:id", (request, reply) => {
  fs.readFile("./data.json", "utf8", (err, data) => {
    if (err) {
      console.error(err);
      return reply.status(500).send("파일 읽기 오류");
    }
    const approvedMembers = JSON.parse(data).approvedMembers;
    const member = approvedMembers.find(m => m.id === parseInt(request.params.id));
    if (!member) return reply.status(404).send("승인된 회원 정보를 찾을 수 없습니다.");
    reply.send(member);
  });
});

// ---- 서버 실행 ----
fastify.listen({ port: process.env.PORT || 3000, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`서버가 실행 중입니다: ${address}`);
});
