/* eslint-disable no-console */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding BeacondFound database...');

  // Xóa dữ liệu cũ (thứ tự để tránh lỗi khóa ngoại)
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.report.deleteMany();
  await prisma.postTag.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.postImage.deleteMany();
  await prisma.post.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('123456', 10);

  // ===== Users =====
  const admin = await prisma.user.create({
    data: {
      fullName: 'Quản trị viên',
      email: 'admin@beacondfound.com',
      phone: '0900000000',
      passwordHash,
      role: 'ADMIN',
      avatarUrl: 'https://i.pravatar.cc/150?img=68',
    },
  });
  const memberA = await prisma.user.create({
    data: {
      fullName: 'Nguyễn Văn A',
      email: 'member1@beacondfound.com',
      phone: '0987654321',
      passwordHash,
      role: 'MEMBER',
      avatarUrl: 'https://i.pravatar.cc/150?img=12',
    },
  });
  const memberB = await prisma.user.create({
    data: {
      fullName: 'Trần Thị B',
      email: 'member2@beacondfound.com',
      phone: '0912345678',
      passwordHash,
      role: 'MEMBER',
      avatarUrl: 'https://i.pravatar.cc/150?img=47',
    },
  });

  // ===== Categories =====
  const categoryData = [
    { name: 'Ví tiền', icon: 'wallet' },
    { name: 'Điện thoại', icon: 'phone' },
    { name: 'Giấy tờ', icon: 'document' },
    { name: 'Chìa khóa', icon: 'key' },
    { name: 'Laptop', icon: 'laptop' },
    { name: 'Tai nghe', icon: 'headphone' },
    { name: 'Balo/Túi xách', icon: 'bag' },
    { name: 'Thú cưng', icon: 'pet' },
    { name: 'Đồ điện tử', icon: 'device' },
    { name: 'Khác', icon: 'other' },
  ];
  const categories = {};
  for (const c of categoryData) {
    const created = await prisma.category.create({ data: c });
    categories[c.name] = created;
  }

  // ===== Posts (tọa độ khu vực TP.HCM) =====
  const img = (seed) => `https://picsum.photos/seed/${seed}/640/480`;
  const daysAgo = (n) => new Date(Date.now() - n * 86400000);

  const postsData = [
    {
      title: 'Rơi ví da đen tại sảnh A tòa nhà X',
      type: 'LOST',
      description:
        'Sáng nay khoảng 8h30, mình có đánh rơi một chiếc ví da màu đen tại khu vực sảnh A tòa nhà X. Trong ví có thẻ CCCD, giấy phép lái xe và một số thẻ ngân hàng mang tên Nguyễn Văn A. Ai nhặt được xin vui lòng liên hệ, mình xin cảm ơn và hậu tạ.',
      eventDate: daysAgo(1),
      address: 'Quận 1, TP.HCM',
      latitude: 10.7769,
      longitude: 106.7009,
      status: 'ACTIVE',
      userId: memberA.id,
      categoryId: categories['Ví tiền'].id,
      images: [img('wallet1'), img('wallet2')],
      tags: ['ví da', 'màu đen', 'giấy tờ', 'hậu tạ'],
    },
    {
      title: 'Nhặt được chùm chìa khóa nhà gồm 3 chìa',
      type: 'FOUND',
      description:
        'Mình nhặt được một chùm chìa khóa gồm 3 chìa kèm móc khóa hình con gấu tại bãi giữ xe siêu thị Lotte Mart. Bạn nào đánh rơi vui lòng mô tả chi tiết móc khóa để mình gửi lại nhé.',
      eventDate: daysAgo(0.5),
      address: 'Bãi giữ xe siêu thị Lotte Mart, Quận 7, TP.HCM',
      latitude: 10.7411,
      longitude: 106.7022,
      status: 'ACTIVE',
      userId: memberB.id,
      categoryId: categories['Chìa khóa'].id,
      images: [img('keys1')],
      tags: ['chìa khóa', 'móc khóa', 'lotte mart'],
    },
    {
      title: 'Mèo anh lông ngắn vàng đi lạc',
      type: 'LOST',
      description:
        'Bé mèo tên Bông đi lạc, lông màu vàng cam, mắt tròn, có đeo vòng cổ màu đỏ. Bé rất thân thiện với người. Ai thấy bé ở khu vực đường Xô Viết Nghệ Tĩnh xin báo giúp mình với ạ, mình cảm ơn rất nhiều.',
      eventDate: daysAgo(2),
      address: 'Đường Xô Viết Nghệ Tĩnh, Bình Thạnh, TP.HCM',
      latitude: 10.8014,
      longitude: 106.7109,
      status: 'ACTIVE',
      userId: memberA.id,
      categoryId: categories['Thú cưng'].id,
      images: [img('cat1'), img('cat2')],
      tags: ['mèo', 'thú cưng', 'lông vàng'],
    },
    {
      title: 'Nhặt được iPhone 13 Pro Max tại sảnh A',
      type: 'FOUND',
      description:
        'Mình nhặt được một chiếc iPhone 13 Pro Max màu xanh tại quán cafe The Workshop. Máy còn pin và đang khóa màn hình. Chủ nhân vui lòng đọc đúng hình nền và mật khẩu mở khóa để nhận lại máy.',
      eventDate: daysAgo(3),
      address: 'Quán cafe The Workshop, Quận 1, TP.HCM',
      latitude: 10.7715,
      longitude: 106.7043,
      status: 'PENDING',
      userId: memberB.id,
      categoryId: categories['Điện thoại'].id,
      images: [img('phone1')],
      tags: ['iphone', 'điện thoại', 'màu xanh'],
    },
    {
      title: 'Mất ví da nâu khu vực canteen',
      type: 'LOST',
      description:
        'Rơi ví da có nhiều giấy tờ quan trọng tại khu vực canteen trường đại học. Trong ví có thẻ sinh viên mang tên Nguyễn Văn A, CMND và khoảng 500k tiền mặt. Ai nhặt được xin liên hệ giúp mình.',
      eventDate: daysAgo(4),
      address: 'Khu vực Quận 1, TP.HCM',
      latitude: 10.7831,
      longitude: 106.6957,
      status: 'PENDING',
      userId: memberA.id,
      categoryId: categories['Ví tiền'].id,
      images: [img('wallet3')],
      tags: ['ví da', 'màu nâu', 'giấy tờ'],
    },
    {
      title: 'Chó Corgi vàng trắng đi lạc gần công viên Tao Đàn',
      type: 'LOST',
      description:
        'Bé Corgi tên Mochi, lông vàng trắng, chân ngắn, đeo vòng cổ xanh dương. Bé đi lạc chiều hôm qua gần công viên Tao Đàn. Gia đình đang rất lo lắng, ai thấy bé xin liên hệ ngay, xin hậu tạ.',
      eventDate: daysAgo(1.5),
      address: 'Công viên Tao Đàn, Quận 1, TP.HCM',
      latitude: 10.7745,
      longitude: 106.6918,
      status: 'ACTIVE',
      userId: memberB.id,
      categoryId: categories['Thú cưng'].id,
      images: [img('dog1'), img('dog2')],
      tags: ['chó', 'corgi', 'thú cưng', 'hậu tạ'],
    },
    {
      title: 'Rơi laptop Macbook Air tại quán cafe Highlands',
      type: 'LOST',
      description:
        'Mình để quên chiếc Macbook Air M2 màu bạc trong túi chống sốc màu xám tại quán cafe Highlands chi nhánh Quận 3. Trên máy có dán sticker hình phi hành gia. Ai nhặt được xin liên hệ, mình xin hậu tạ.',
      eventDate: daysAgo(1),
      address: 'Quán Cafe Highlands, Quận 3, TP.HCM',
      latitude: 10.7796,
      longitude: 106.6878,
      status: 'ACTIVE',
      userId: memberA.id,
      categoryId: categories['Laptop'].id,
      images: [img('laptop1')],
      tags: ['laptop', 'macbook', 'màu bạc'],
    },
    {
      title: 'Nhặt được ví da đen tại Highlands Coffee',
      type: 'FOUND',
      description:
        'Mình nhặt được một chiếc ví da màu đen, bên trong có CCCD tên Trần Văn B và một số giấy tờ khác. Ai mất liên hệ mình nhé, mình sẽ kiểm tra thông tin trước khi trả.',
      eventDate: daysAgo(2),
      address: 'Highlands Coffee, Quận 10, TP.HCM',
      latitude: 10.7726,
      longitude: 106.6679,
      status: 'ACTIVE',
      userId: memberB.id,
      categoryId: categories['Ví tiền'].id,
      images: [img('wallet4')],
      tags: ['ví da', 'màu đen', 'cccd'],
    },
    {
      title: 'Nhặt được tai nghe AirPods Pro tại phòng gym',
      type: 'FOUND',
      description:
        'Nhặt được hộp tai nghe AirPods Pro màu trắng tại phòng gym California Quận 5. Chủ nhân mô tả đúng tình trạng hộp (vết xước, hình dán) để nhận lại nhé.',
      eventDate: daysAgo(5),
      address: 'California Fitness, Quận 5, TP.HCM',
      latitude: 10.7554,
      longitude: 106.6665,
      status: 'ACTIVE',
      userId: memberB.id,
      categoryId: categories['Tai nghe'].id,
      images: [img('airpods1')],
      tags: ['tai nghe', 'airpods', 'màu trắng'],
    },
    {
      title: 'Mất balo đen chứa giấy tờ trên xe bus số 19',
      type: 'LOST',
      description:
        'Mình để quên balo màu đen hiệu Adidas trên xe bus số 19 chiều ngày hôm kia. Trong balo có laptop Dell, hồ sơ xin việc và giấy tờ cá nhân. Ai nhặt được xin liên hệ giúp, mình xin cảm ơn và hậu tạ.',
      eventDate: daysAgo(6),
      address: 'Tuyến xe bus 19, Bến Thành, TP.HCM',
      latitude: 10.7721,
      longitude: 106.698,
      status: 'ACTIVE',
      userId: memberA.id,
      categoryId: categories['Balo/Túi xách'].id,
      images: [img('bag1')],
      tags: ['balo', 'màu đen', 'xe bus'],
    },
  ];

  const createdPosts = [];
  for (const p of postsData) {
    const { images, tags, ...data } = p;
    const post = await prisma.post.create({
      data: { ...data, images: { create: images.map((url) => ({ imageUrl: url })) } },
    });
    for (const raw of tags) {
      const name = raw.trim().toLowerCase();
      const tag = await prisma.tag.upsert({ where: { name }, update: {}, create: { name } });
      await prisma.postTag.create({ data: { postId: post.id, tagId: tag.id } });
    }
    createdPosts.push(post);
  }

  // ===== Conversations & Messages =====
  const conv1 = await prisma.conversation.create({
    data: {
      postId: createdPosts[0].id, // ví da đen của A
      memberOneId: memberB.id,
      memberTwoId: memberA.id,
    },
  });
  await prisma.message.createMany({
    data: [
      {
        conversationId: conv1.id,
        senderId: memberB.id,
        content: 'Chào bạn, mình thấy bài đăng của bạn về chiếc ví đen.',
        isRead: true,
        createdAt: daysAgo(0.9),
      },
      {
        conversationId: conv1.id,
        senderId: memberB.id,
        content: 'Sáng nay mình có nhặt được một chiếc giống vậy ở khu vực bãi xe. Mình gửi ảnh bạn xem phải không nhé.',
        isRead: true,
        createdAt: daysAgo(0.88),
      },
      {
        conversationId: conv1.id,
        senderId: memberA.id,
        content: 'Đúng rồi bạn ơi! Ví của mình có vết xước nhỏ ở góc phải. Bạn có thể gửi thêm ảnh chi tiết được không?',
        isRead: true,
        createdAt: daysAgo(0.85),
      },
      {
        conversationId: conv1.id,
        senderId: memberB.id,
        content: 'Bạn có thể gửi thêm ảnh chi tiết của ví không? Mình cần xác minh trước khi trả.',
        isRead: false,
        createdAt: daysAgo(0.1),
      },
    ],
  });

  const conv2 = await prisma.conversation.create({
    data: {
      postId: createdPosts[5].id, // chó corgi của B
      memberOneId: memberA.id,
      memberTwoId: memberB.id,
    },
  });
  await prisma.message.createMany({
    data: [
      {
        conversationId: conv2.id,
        senderId: memberA.id,
        content: 'Chào bạn, mình nghĩ đã nhìn thấy bé Corgi gần công viên chiều nay.',
        isRead: true,
        createdAt: daysAgo(1.2),
      },
      {
        conversationId: conv2.id,
        senderId: memberB.id,
        content: 'Thật hả bạn! Bạn thấy bé ở khu vực nào vậy? Mình qua liền.',
        isRead: false,
        createdAt: daysAgo(1.1),
      },
    ],
  });

  // ===== Notifications =====
  await prisma.notification.createMany({
    data: [
      {
        userId: memberA.id,
        type: 'POST_APPROVED',
        content: 'Bài đăng "Rơi ví da đen tại sảnh A tòa nhà X" của bạn đã được duyệt và hiển thị công khai.',
        targetUrl: `/posts/${createdPosts[0].id}`,
        isRead: false,
        createdAt: daysAgo(0.8),
      },
      {
        userId: memberA.id,
        type: 'NEW_MESSAGE',
        content: 'Trần Thị B đã gửi cho bạn một tin nhắn mới.',
        targetUrl: `/messages/${conv1.id}`,
        isRead: false,
        createdAt: daysAgo(0.1),
      },
      {
        userId: memberA.id,
        type: 'SYSTEM',
        content: 'Mẹo tìm kiếm đồ vật hiệu quả: hãy thêm chi tiết về thẻ và hình ảnh rõ nét để tăng cơ hội tìm lại đồ vật của bạn.',
        targetUrl: null,
        isRead: true,
        createdAt: daysAgo(1.5),
      },
      {
        userId: memberB.id,
        type: 'POST_APPROVED',
        content: 'Bài đăng "Nhặt được chùm chìa khóa nhà gồm 3 chìa" của bạn đã được duyệt và hiển thị công khai.',
        targetUrl: `/posts/${createdPosts[1].id}`,
        isRead: true,
        createdAt: daysAgo(0.4),
      },
      {
        userId: memberB.id,
        type: 'NEW_MESSAGE',
        content: 'Nguyễn Văn A đã gửi cho bạn một tin nhắn mới.',
        targetUrl: `/messages/${conv2.id}`,
        isRead: false,
        createdAt: daysAgo(1.1),
      },
      {
        userId: memberA.id,
        type: 'REPORT_RESOLVED',
        content: 'Báo cáo vi phạm của bạn đã được xử lý. Cảm ơn bạn đã góp phần xây dựng cộng đồng an toàn.',
        targetUrl: null,
        isRead: true,
        createdAt: daysAgo(2),
      },
    ],
  });

  // ===== Reports =====
  await prisma.report.createMany({
    data: [
      {
        reporterId: memberA.id,
        postId: createdPosts[7].id,
        reason:
          'Người này yêu cầu tôi chuyển tiền phí vận chuyển trước khi trả lại ví nhưng khi tôi yêu cầu video call để xác nhận thì lấy lý do camera hỏng. Tài khoản mới tạo hôm qua và có biểu hiện đáng ngờ.',
        status: 'PENDING',
        createdAt: daysAgo(0.2),
      },
      {
        reporterId: memberB.id,
        reportedUserId: memberA.id,
        reason: 'Người dùng đăng nhiều bài trùng lặp với nội dung không đúng sự thật.',
        status: 'PENDING',
        createdAt: daysAgo(1),
      },
      {
        reporterId: memberA.id,
        postId: createdPosts[1].id,
        reason: 'Bài đăng có dấu hiệu spam, đăng lặp lại nhiều lần.',
        status: 'RESOLVED',
        createdAt: daysAgo(3),
      },
      {
        reporterId: memberB.id,
        postId: createdPosts[2].id,
        reason: 'Nghi ngờ hình ảnh không đúng với mô tả.',
        status: 'REJECTED',
        createdAt: daysAgo(4),
      },
    ],
  });

  console.log('Seed thành công!');
  console.log('-----------------------------------------');
  console.log('Tài khoản admin : admin@beacondfound.com / 123456');
  console.log('Tài khoản member: member1@beacondfound.com / 123456');
  console.log('Tài khoản member: member2@beacondfound.com / 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
