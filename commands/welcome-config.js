const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { createWelcomeCard, DEFAULT_SETTINGS } = require('../welcomeCard');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('welcome-config')
    .setDescription('تخصيص بطاقة الترحيب (النص، الافتار، الخلفية)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('title')
        .setDescription('تغيير النص الرئيسي لبطاقة الترحيب')
        .addStringOption(o =>
          o.setName('text')
            .setDescription('اكتب النص - مثال: مرحباً في السيرفر')
            .setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('subtitle')
        .setDescription('الاسم الكبير تحت العنوان (استخدم {member} = اسم المدعو المعروض)')
        .addStringOption(o =>
          o.setName('text')
            .setDescription('مثال: {member}')
            .setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('inviter-line')
        .setDescription('سطر الداعي الصغير (استخدم {inviter} = اسم الداعي، أو "none" للإخفاء)')
        .addStringOption(o =>
          o.setName('text')
            .setDescription('مثال: invited by {inviter}')
            .setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('server-line')
        .setDescription('(موقوف) اسم السيرفر يظهر الآن أعلى يمين البطاقة')
        .addStringOption(o =>
          o.setName('text')
            .setDescription('لن يظهر في الصورة بعد الآن')
            .setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('position')
        .setDescription('تحديد مكان النص')
        .addStringOption(o =>
          o.setName('align')
            .setDescription('المحاذاة')
            .setRequired(true)
            .addChoices(
              { name: 'يمين', value: 'right' },
              { name: 'وسط', value: 'center' },
              { name: 'يسار', value: 'left' }
            ))
        .addIntegerOption(o =>
          o.setName('x')
            .setDescription('المسافة الأفقية بالبكسل من جهة المحاذاة (0-500)')
            .setMinValue(0)
            .setMaxValue(500))
        .addIntegerOption(o =>
          o.setName('y')
            .setDescription('الموضع العمودي للنص الرئيسي (0-350)')
            .setMinValue(0)
            .setMaxValue(350))
    )
    .addSubcommand(sub =>
      sub.setName('avatar')
        .setDescription('تغيير حجم الافتار الدائري (80-350)')
        .addIntegerOption(o =>
          o.setName('size')
            .setDescription('الحجم بالبكسل - مثال: 200')
            .setRequired(true)
            .setMinValue(0)
            .setMaxValue(350))
    )
    .addSubcommand(sub =>
      sub.setName('background')
        .setDescription('تغيير خلفية البطاقة')
        .addStringOption(o =>
          o.setName('type')
            .setDescription('نوع الخلفية')
            .setRequired(true)
            .addChoices(
              { name: 'متدرج لونين', value: 'gradient' },
              { name: 'لون سادة', value: 'solid' },
              { name: 'صورة من رابط', value: 'image' }
            ))
        .addStringOption(o =>
          o.setName('color1')
            .setDescription('اللون الأول (Hex مثل #3b82f6) - اختياري'))
        .addStringOption(o =>
          o.setName('color2')
            .setDescription('اللون الثاني للمتدرج (Hex) - اختياري'))
        .addStringOption(o =>
          o.setName('url')
            .setDescription('رابط صورة الخلفية (مطلوب لنوع صورة)'))
    )
    .addSubcommand(sub =>
      sub.setName('text-color')
        .setDescription('تغيير لون النصوص')
        .addStringOption(o =>
          o.setName('color')
            .setDescription('اللون (Hex مثل #ffffff)')
            .setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('preview')
        .setDescription('عرض معاينة للبطاقة الحالية'))
    .addSubcommand(sub =>
      sub.setName('reset')
        .setDescription('إعادة كل إعدادات البطاقة للافتراضي')),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();
    const db = client.loadDB();
    if (!db[interaction.guild.id]) db[interaction.guild.id] = {};
    if (!db[interaction.guild.id].welcomeConfig) db[interaction.guild.id].welcomeConfig = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    const config = db[interaction.guild.id].welcomeConfig;

    const embedContext = (line) => `\n\n**المتغيرات المتاحة:**\n{member} = اسم العضو\n{inviter} = اسم الداعي\n{server} = اسم السيرفر`;

    try {
      switch (sub) {
        case 'title': {
          const text = interaction.options.getString('text');
          config.text.main = text;
          await interaction.reply({ content: `✅ تم تغيير النص الرئيسي إلى:\n**${text}**`, flags: MessageFlags.Ephemeral });
          break;
        }
        case 'subtitle': {
          const text = interaction.options.getString('text');
          config.text.sub = text;
          await interaction.reply({ content: `✅ تم تغيير النص الثاني إلى:\n**${text}**${embedContext()}`, flags: MessageFlags.Ephemeral });
          break;
        }
        case 'inviter-line': {
          const text = interaction.options.getString('text');
          if (text.toLowerCase() === 'none') {
            config.text.inviter = '';
            await interaction.reply({ content: '✅ تم إخفاء سطر الداعي.', flags: MessageFlags.Ephemeral });
          } else {
            config.text.inviter = text;
            await interaction.reply({ content: `✅ تم تغيير سطر الداعي إلى:\n**${text}**${embedContext()}`, flags: MessageFlags.Ephemeral });
          }
          break;
        }
        case 'server-line': {
          const text = interaction.options.getString('text');
          if (text.toLowerCase() === 'none') {
            config.text.server = '';
            await interaction.reply({ content: '⚠️ سطر السيرفر موقوف - اسم السيرفر يظهر الآن أعلى يمين البطاقة.', ephemeral: true, flags: MessageFlags.Ephemeral });
          } else {
            config.text.server = text;
            await interaction.reply({ content: '⚠️ سطر السيرفر موقوف - اسم السيرفر يظهر الآن أعلى يمين البطاقة.', ephemeral: true, flags: MessageFlags.Ephemeral });
          }
          break;
        }
        case 'position': {
          const align = interaction.options.getString('align');
          const x = interaction.options.getInteger('x');
          const y = interaction.options.getInteger('y');
          config.text.align = align;
          if (x !== null) config.text.x = x;
          if (y !== null) config.text.y = y;
          await interaction.reply({ content: `✅ تم تحديث مكان النص:\nالمحاذاة: ${align} | المسافة الأفقية: ${x ?? config.text.x} | الموضع العمودي: ${y ?? config.text.y}`, flags: MessageFlags.Ephemeral });
          break;
        }
        case 'avatar': {
          const size = interaction.options.getInteger('size');
          config.avatar.size = size;
          await interaction.reply({ content: `✅ تم تغيير حجم الافتار إلى **${size} بكسل**`, flags: MessageFlags.Ephemeral });
          break;
        }
        case 'background': {
          const type = interaction.options.getString('type');
          const color1 = interaction.options.getString('color1');
          const color2 = interaction.options.getString('color2');
          const url = interaction.options.getString('url');

          if (type === 'gradient') {
            if (!color1 || !color2) {
              return await interaction.reply({ content: '⚠️ لنوع المتدرج تحتاج إدخال **color1** و **color2**.', flags: MessageFlags.Ephemeral });
            }
            config.background.type = 'gradient';
            config.background.color1 = color1;
            config.background.color2 = color2;
          } else if (type === 'solid') {
            if (!color1) {
              return await interaction.reply({ content: '⚠️ لنوع اللون السادة تحتاج إدخال **color1**.', flags: MessageFlags.Ephemeral });
            }
            config.background.type = 'solid';
            config.background.solid = color1;
          } else {
            if (!url) {
              return await interaction.reply({ content: '⚠️ لنوع الصورة تحتاج إدخال **url**.', flags: MessageFlags.Ephemeral });
            }
            config.background.type = 'image';
            config.background.imageUrl = url;
          }
          await interaction.reply({ content: `✅ تم تحديث الخلفية إلى نوع: **${type}**`, flags: MessageFlags.Ephemeral });
          break;
        }
        case 'text-color': {
          const color = interaction.options.getString('color');
          config.text.color = color;
          await interaction.reply({ content: `✅ تم تغيير لون النص إلى **${color}**`, flags: MessageFlags.Ephemeral });
          break;
        }
        case 'preview': {
          const member = interaction.member;
          const img = await createWelcomeCard(member, { id: null, tag: 'KrypS_Real' }, config);
          await interaction.reply({
            content: 'هذه معاينة لبطاقة الترحيب الحالية:',
            files: [{ attachment: img, name: 'welcome-preview.png' }],
            ephemeral: true,
            flags: MessageFlags.Ephemeral,
          });
          break;
        }
        case 'reset': {
          db[interaction.guild.id].welcomeConfig = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
          await interaction.reply({ content: '✅ تم إعادة الإعدادات إلى الافتراضي.', flags: MessageFlags.Ephemeral });
          break;
        }
        default:
          await interaction.reply({ content: 'أمر غير معروف.', flags: MessageFlags.Ephemeral });
      }
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: `⚠️ حدث خطأ: ${err.message}`, flags: MessageFlags.Ephemeral });
    }

    await client.saveDB(db).catch(() => {});
  },
};