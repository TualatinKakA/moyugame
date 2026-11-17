# 原版奖杯条件、成本、Buff 与升阶修正全量清单

资料口径：`musicfamily.org/realm/TrophyPage` 当前收录条目。Wiki 内容用于机制对照，不代表官方服务器实时版本号证明。

## 1. 当前开发版与原版的关系

当前开发版不是“一个奖杯和 Buff 都没做”，而是已有少量法术奖杯及部分效果，但缺少完整奖杯系统。

主要差异：

- 当前只有部分法术奖杯 ID 和效果，没有完整建筑、产值、点击、法力、派系、秘密与活动奖杯系列；
- 当前奖杯大多自动解锁，没有完整实现原版“条件达成 → 可用 → 支付成本 → Buff 生效”的流程；
- 当前没有逐项实现原版成本、A 阶段免费、A 阶段削弱和公式修正；
- 当前没有完整的成就分类、进度、详情、购买和回看界面；
- 当前部分法术奖杯的连续释放、时间窗和链式中断条件仍是简化判定。

本清单中的“部分接入”不表示已与原版完全等价，只表示已有部分条件或效果。

## 2. 字段说明

| 字段 | 含义 |
| --- | --- |
| 原名称 | 原版 Trophy 或 Trophy 等级名称；同名不同级保留为不同条目 |
| 原版条件 | 原版 Requirement／Requirements 内容 |
| 原版成本 | 原版 Cost；未标注时不擅自解释为免费 |
| 原版 Buff／公式 | 原版 Effect 与 Formula 内容 |
| 原版升阶修正 | A1+ Free、A Nerfed、A 阶段数值或其他 Ascension 说明 |
| 当前状态 | 当前开发版的接入范围或缺失情况 |


## 3. 数量汇总

| 原始分组 | 条目数 |
| --- | --- |
| SecretTrophies-map | 64 |
| AllegiancesTrophies-map | 41 |
| MiscTrophies-map | 170 |
| MagicTrophies-map | 61 |
| BuildingTrophies-map | 566 |


共提取 902 个名称／等级条目。

## 4.SecretTrophies-map

| 原名称 | 原版条件 | 原版成本 | 原版 Buff／公式 | 原版升阶修正 | 当前状态 |
| --- | --- | --- | --- | --- | --- |
| Leet | Have exactly 1337 Coins at any given time. | 10 M (1e7), A1+ Free | Increase the production of all buildings by 13.37%. | A1+ Free | 未实现 |
| Unitary | Have exactly 1 of each building at any given time. | 1111, A1+ Free | Increase the production of all buildings by 11.11111111%. This can be done at any R. | A1+ Free | 未实现 |
| Building Hater | Reach 100'000 coins without building anything. | 1, A1+ Free | Increase clicking reward by 25% (A Nerfed) | A1+ Free；A Nerfed | 未实现 |
| Grand Diplomat | Ally with each Vanilla, Neutral and Prestige factions at least once. | 1, A1+ Free | Increase your chance to find Faction Coins by an additional 2%. | A1+ Free | 未实现 |
| Exchange Master | Purchase 500 Royal Exchanges in a single game. | 500 Dc (5e35), A1+ Free | Increase Royal Exchange bonus by +5%. | A1+ Free | 未实现 |
| Lucky Neutral | Spend 7777 minutes being Neutral across all reincarnations.(= 5d 9h 37m) | 30 No (3e31), A1+ Free | Increase the production of Neutral buildings by 50%. (A Nerfed) | A1+ Free；A Nerfed | 未实现 |
| Perfectly Good | Spend 333 hours being Good across all reincarnations.(= 13d 21h) | 30 No (3e31), A1+ Free | Increase the production of Good buildings by 50%. (A Nerfed) | A1+ Free；A Nerfed | 未实现 |
| Diabolical Evil | Spend 6 days, 66 hours, 666 minutes, 666666 seconds being Evil across all reincarnations (= 16d 22h 17m 6s). | 30 No (3e31), A1+ Free | Increase the production of Evil buildings by 100%. (A Nerfed) | A1+ Free；A Nerfed | 未实现 |
| Assistant Squasher | Click 100 times on the little assistant around your realm. | 100, A1+ Free | Instantly add 1 additional assistant. | A1+ Free | 未实现 |
| Rewind | Abdicate after producing at least 1 Oc (1E27) Coins. | 1 Oc (1e27), A1+ Free | Increase the production of all buildings by 8%. (A Nerfed) | A1+ Free；A Nerfed | 未实现 |
| Faction Grinder | Purchase the first 6 Faction Heritage upgrades in a single game. | 1 M (1e6), A1+ Free | Increase your chance to find Faction Coins by additional 2%. | A1+ Free | 未实现 |
| Master Archeologist You have discovered all the relics of the Ancient Races. | Unlock Titans, Druids, and Faceless | 1 Ud (1e36), A1+ Free | Increase the production of all buildings by 25% when you are playing as Titan, Druid or Faceless. (A Nerfed) | A1+ Free；A Nerfed | 未实现 |
| Spellfury | Cast the Tax Collection spell while having 3 other spells active. | 4333, A1+ Free | Multiplicatively increase Mana Regeneration by 5%. | A1+ Free | 未实现 |
| Speedrun | Reach 1 M (1E6) coins in less than 5 minutes, without using Gem Power. | 1 coins, A1+ Free | Increase your base clicking reward by +1 M (1e6). | A1+ Free | 未实现 |
| Equality | With no less than 3 days of playtime, have less than 1 minute of playtime difference for the 3 alignments. | 1 Qad (1e45), A1+ Free | Increase the production of all buildings by 100%. (A Nerfed) This can be done at R0. | A1+ Free；A Nerfed | 未实现 |
| Beard Carpet | Have at least 1 km beards on your assistants (using Bearded Assistant faction upgrade). | 3000, A1+ Free | Increase assistants production by 10%. (A Nerfed) | A1+ Free；A Nerfed | 未实现 |
| Premeditation | Have at least 850 Dark Temples on any individual run before affiliating with the Drow. | 50 Ocd (5e58), A1+ Free | Increase maximum Mana by +250. | A1+ Free | 未实现 |
| Fast Forward | Accumulate an offline time of at least 88 hours. The sum of all your offline reports counts towards this purpose.(3d 16h, This R) | 8 Oc (8e27), A1+ Free | Increase offline production by 200%. (A Nerfed) | A1+ Free；A Nerfed | 未实现 |
| Need a Head Start? | Don't do anything for 5 minutes after starting a new game or after abdicating. Don't buy anything and don't click anything | Free | Instantly adds 25 gold coins. | 未标注 | 未实现 |
| Realm Digger | Excavate 400 times. | 100 Nod (1e62), A1+ Free | Increases the production of all buildings by 0.15% per excavation. (A Nerfed) | A1+ Free；A Nerfed | 未实现 |
| Harlequin | As a Mercenary, purchase one upgrade from 11 different factions. | 5 Qivg (5e78), A1+ Free | Increases the production of all buildings based on the number of upgrades bought this game from different Factions (A Nerfed).；(x ^ 3)%, where x is the number of Factions with at least one of their upgrades being used (up to 3375% maximum possible). | A1+ Free；A Nerfed | 未实现 |
| Lucifer | As a Good Mercenary, purchase only Evil faction upgrades or vice versa. | 5 Qivg (5e78), A1+ Free | Increases the production of all non-neutral buildings by 300%. (A Nerfed) | A1+ Free；A Nerfed | 未实现 |
| Mathematician | Have buildings amounts exactly equal to 2^tier from bottom to top, starting from 2^0 Halls of Legends up to 2^10 Farms. 1024 Farms, 512 Inns, 256 Blacksmiths, 128, 64, 32, 16, 8, 4, 2 and 1 Hall of Legends. (Building count has to be exact) | 1 Td (1e42), A1+ Free | Increases the production of all buildings based on their tier. (A Nerfed)；(10 * (12 - T))%, where T is building tier. | A1+ Free；A Nerfed | 未实现 |
| Mercenary Spirit | Reincarnate while playing as a Mercenary. | 1 Ocd (1e57), A1+ Free | Increases the production of all buildings by 15% per reincarnation. (For Mercenary only) (A Nerfed) | A1+ Free；A Nerfed | 未实现 |
| Bloodstream | Purchase 100 upgrades of each faction (Anything that is faction colored counts) (All Game) | 1 Tg (1e93), A1+ Free | Increase the production of all buildings based on the time spent as faction of the bloodline you are using. While you are a mercenary, a fraction of the total time spent as mercenary is added to your Bloodstream bonus based on the amount of Mercenary upgrades purchased in this game from the faction of the bloodline you are using. (A Nerfed)；(0.1 * x ^ 0.65)%, where x is your (adjusted) time spent affiliated with the bloodline's faction in seconds. | A1+ Free；A Nerfed | 未实现 |
| Unlimited Mana | Have a Mana Regeneration rate of at least 300 per second. | 80 Vg (8e64), A1+ Free | Increase Mana Regeneration by +2. | A1+ Free | 未实现 |
| For Science! | Purchase all the research facilities. | 1 Qag (1e123), A1+ Free | Increase the production of all buildings by 100% when you can access Research. Can be done at R16. | A1+ Free | 未实现 |
| Exchange Lord | Purchase 1500 Royal Exchanges in a single game. | 500 Qag (5e125), A1+ Free | Increase Royal Exchange bonus by +5%. | A1+ Free | 未实现 |
| Magician | Discover at least 10 Spellcraft Researches. | 250 Noqag (2.5e152), A1+ Free | Increase Spellcraft upgrade slots by 1. | A1+ Free | 未实现 |
| Artisan | Discover at least 10 Craftsmanship Researches. | 250 Noqag (2.5e152), A1+ Free | Increase Craftsmanship upgrade slots by 1. | A1+ Free | 未实现 |
| Demigod | Discover at least 10 Divine Researches. | 250 Noqag (2.5e152), A1+ Free | Increase Divine upgrade slots by 1. | A1+ Free | 未实现 |
| Businessman | Discover at least 10 Economics Researches. | 250 Noqag (2.5e152), A1+ Free | Increase Economics upgrade slots by 1. | A1+ Free | 未实现 |
| Apothecary | Discover at least 10 Alchemy Researches. | 250 Noqag (2.5e152), A1+ Free | Increase Alchemy upgrade slots by 1. | A1+ Free | 未实现 |
| Warlord | Discover at least 10 Warfare Researches. | 250 Noqag (2.5e152), A1+ Free | Increase Warfare upgrade slots by 1. | A1+ Free | 未实现 |
| Faction Run | Reach 1.5 M (1.5E6) Faction Coins in less than 5 minutes, without using Gem Power, Excavations or any spell. | 1 coins, A1+ Free | Increase Faction Coin find chance by +10%. | A1+ Free | 未实现 |
| No Recruiting | Reach 1 NoVg (1E90) gems in a Reincarnation without ever affiliating with the Mercenaries. | 1 Tg (1e93), A1+ Free | Increase Mercenary production by 1% per Reincarnation. | A1+ Free | 未实现 |
| That Excavated Quickly | Excavate 1000 times in the first 30 seconds of a run (This Game) | 1 Qag (1e123), A1+ Free | Your chance to find Faction Coins with excavations is increased by an additional 5%. | A1+ Free | 未实现 |
| glho kohhl snod | Import this into you game Barely whispering these letters makes your heart pound harder. | 1000 coins, A1+ Free | Increase clicking reward by 50%. | A1+ Free | 未实现 |
| Mana Matrix | Have exactly 4767 maximum Mana. | 1000 coins, A1+ Free | Multiplicatively increase Maximum Mana by 15%. | A1+ Free | 未实现 |
| Suggestion Master | Open the changelog and ponder about what could be added in there for 3 minutes. | 1000 coins, A1+ Free | Increase the production of all buildings base on mysterious events.；(10 * a) + b + (0.1 * d) * (0.01 * c)%, where a, b, c and d are the respective game version numbers (a.b.c.d). | A1+ Free | 未实现 |
| Rule 'dis | Abdicate 10 times within 3 minutes. | 1000 coins, A1+ Free | Increase Mana Regeneration by +1. | A1+ Free | 未实现 |
| Because I Like to Grind | Spend at least 3 hours playing in this game. | 1000 coins, A1+ Free | Increase Royal Exchange bonus by an additional 1%. | A1+ Free | 未实现 |
| Triple Weirdness | 333 of each Royal Exchange, R40+ | 1 TTg (1e102), A2+ Free | Increase Faction Coins generation while offline based on your Mana Regeneration.；(300 * log10(1 + x)^3), where x is your offline Mana Regeneration. | A2+ Free | 未实现 |
| Stoic Resistance | Reach an amount of Gems in your treasury equal to the requisite of the first Reincarnation (1 Oc (1E27) gems) without abdicating since the start of a new Reincarnation. Gems Needed : A0 = 1 Oc (1e27), A1 = 177.8 Qi (1.778e20), A2 = 1.540 Qa (1.540e15), A3 = 245.8 B (2.458e11), A4 = 349.1 M (3.491e8) | 1 Coins, A1+ Free | Increase base clicking reward by +1 T (1e12) | A1+ Free | 未实现 |
| Van!shment | Reach an Offline Bonus of at least 1 Qa (1E15) % (Post-Ascension is 1895%). | 10 Noqag (1e151), A1+ Free | Increase the production of all buildings based on offline bonus.；(1.25 * log10(1+x) ^ 1.25)%, where x is the pre-A offline multiplier. | A1+ Free | 未实现 |
| Iron Rush | Reach 725 Iron Strongholds in 5 minutes without use of Gem Power and Reincarnation Power. | 3.8 SxSxg (3.8e201), A1+ Free | Iron Strongholds count 5% more for all purposes. | A1+ Free | 未实现 |
| Colorful Autocasting | R42+, Have each type of autocasting active simultaneously. | 5 Sxd (5e51), A2+ Free | Multiplicatively increase Mana Regeneration by 10%. Autocasting Needed : Silver, Gold, Bronze, Diamond | A2+ Free | 未实现 |
| Spell Cataclysm | Have at least 4 spells active on tier 5 or higher, R42+ | 640 Vg (6.4e65), A2+ Free | Multiplicatively increase Maximum Mana by 25%. | A2+ Free | 未实现 |
| Advisor Insight | Click the Hint button 100 times. | 100 No (1e32), A1+ Free | Increase the production of all buildings by 10%. (A Nerfed) | A1+ Free；A Nerfed | 未实现 |
| Dragon Tamer | R46+, Fully develop your Spiky Egg into an Elder Dragon. | 100 Vg (1e65), A2+ Free | Increase the production of all buildings by 200% (A Nerfed) and triples Faction Coin find chance. | A2+ Free；A Nerfed | 未实现 |
| Helden Sterben Nicht | Join Mercenaries, then Undead, then Angels within 15 minutes since the beginning of a new run in a single game session. | 5 Qavg (5e75), A1+ Free | Multiplicatively increase Mana Regeneration and Maximum Mana by 15%. | A1+ Free | 未实现 |
| Mana Waste | Have mana regeneration higher than max mana. | 1 Td (1e42), A1+ Free | Increase Maximum Mana based on spells cast in this game.；+(127 * (log10(1 + x)) ^ 2.7), where x is spells cast this game. | A1+ Free | 未实现 |
| Prismatic Mana | R40+, Cast the same amount of Faction spells with all Vanilla and Neutral Factions with a minimum of 100 casts. | 100 No (1e32), A2+ Free | Multiplicatively increase Mana Regeneration by 25%. Warning : All Spells have to be exact same count, Tiered casting may go over the count you need. Spells Needed : Fairy Chanting, Moon Blessing, God's Hand, Goblin's Greed, Night Time, Hellfire Blast, Lightning Strike, Brainwave, Grand Balance | A2+ Free | 未实现 |
| Autoclicker | R60+, Perform 40 autoclicks in 1 second | 100 Qaq (1e125), A2+ Free | Multiply Faction Coin find chance by x5 for automatic clicks only. | A2+ Free | 未实现 |
| Exchange High Lord | 5000 Royal Exchanges | 10 DQig (1e160), A2+ Free | Increase royal exchange bonus by +250%. | A2+ Free | 未实现 |
| Genealogist | Have a total of 300 Lineage levels across all Lineage. | 1 NoQig (1e180), A2+ Free | Increase the production of all buildings based on the total amount of lineage levels you have.；(2.5 * x ^1.35)%, where x is total amount of lineage levels you have. | A2+ Free | 未实现 |
| Holy Frenzy | A2+, In a single reincarnation, have a 3 day combined activity time of Holy Light and Blood Frenzy. | 100 Dc (1e35), A3+ Free | While Blood Frenzy or Holy Light are active, increase the production of all buildings.；(250 * T ^ 2)%, where T is active tier of Blood Frenzy or Holy Light. Effect (A4+ only) : Also multiplicatively increase Faction Coin find chance by 500% while playing as any Good or Evil faction. | A3+ Free | 未实现 |
| Uniformity | A2+, Have no less than 3 days of playtime this R with at least 24 hours each Order, Chaos and Balance and have less than 1 minute of playtime between them. (This R) | 100 Qid (1e50), A3+ Free | Increases the production of all buildings based on time spent as least used alignment (this Reincarnation).；(x ^ 0.75)%, where x is the time spent with your least used alignment (primary or secondary) in seconds. | A3+ Free | 未实现 |
| Art of the Crow Trophy | Have any 6 complete Faction Artifact Sets. | 1 Qavg (1e75), A3+ Free Art of the Crow Upgrade | Multiplicatively increase max mana. Chaos；Multiplicatively increase assistants. Balance；Multiplicatively increase mana regeneration. Good；The amount increased is based on Excavations made.；(0.05 * x)%, where x is excavation count. Evil；The amount increased is Based on production bonus from Gems.；(50 + 25 * x ^ 0.25)%, where x is production bonus from Gems. Neutral；The amount increased is based on Royal Exchanges made；(1.5 * x ^ 0.5)%, where x royal exchanges made. | A3+ Free | 未实现 |
| Faction Ruler | Unlock all the Advanced Heritages. | 120 Notg (1.2e122), A3+ Free | Double Advanced Heritage powers if they match any of your alignments (cumulative). | A3+ Free | 未实现 |
| MAD Masks | Find all fragments of the Makers, Archon and Djinn masks. | 1 SpQag (1.e144), A3+ Free | Increase the production of all buildings based on the highest excavation count made in this Reincarnation.；(1.5 * x ^ 0.6)%, where x is highest excavation count made in this Reincarnation. | A3+ Free | 未实现 |
| Future Linkin | A2+, Abdicate with at least 100,000 Unique Buildings. | 10 Sptg (1e115), A3+ Free | Multiplicatively increase Faction Coin find chance based on time spent in the last game session.；(214 + 0.03 * x ^ 0.7)%, where x is time spent in last game in seconds. Base : 214% | A3+ Free | 未实现 |
| God's Fingers | R160+, Reach 100 M (1e8) automatic clicks in this Reincarnation. | Free | Clicks count 100% more and autoclicks 5 times per second. | 未标注 | 未实现 |
| True Harlequin | R160+, Mercenary Duel unlocked, As a Mercenary, purchase one upgrade from 15 different factions. | 1e152 (100 Noqag) | Increases the production of all buildings based on the number of upgrades bought this game from different Factions.；((x * floor(1 + x / 5)) ^ 3)%, where x is the number of Factions with at least one of their upgrades being used (up to 216,000% maximum possible). | 未标注 | 未实现 |


## 4.AllegiancesTrophies-map

| 原名称 | 原版条件 | 原版成本 | 原版 Buff／公式 | 原版升阶修正 | 当前状态 |
| --- | --- | --- | --- | --- | --- |
| Fairy Champion | Purchase the first 12 faction upgrades in this game (this includes Trade Treaty, Friendship Pact, and Alliance) | 未标注 | 未标注 | 未标注 | 未实现 |
| Elven Champion | Purchase the first 12 faction upgrades in this game (this includes Trade Treaty, Friendship Pact, and Alliance) | 未标注 | 未标注 | 未标注 | 未实现 |
| Angel Champion | Purchase the first 12 faction upgrades in this game (this includes Trade Treaty, Friendship Pact, and Alliance) | 未标注 | 未标注 | 未标注 | 未实现 |
| Goblin Champion | Purchase the first 12 faction upgrades in this game (this includes Trade Treaty, Friendship Pact, and Alliance) | 未标注 | 未标注 | 未标注 | 未实现 |
| Undead Champion | Purchase the first 12 faction upgrades in this game (this includes Trade Treaty, Friendship Pact, and Alliance) | 未标注 | 未标注 | 未标注 | 未实现 |
| Demon Champion | Purchase the first 12 faction upgrades in this game (this includes Trade Treaty, Friendship Pact, and Alliance) | 未标注 | 未标注 | 未标注 | 未实现 |
| Titan Champion | Purchase the first 12 faction upgrades in this game (this includes Trade Treaty, Friendship Pact, and Alliance) | 未标注 | 未标注 | 未标注 | 未实现 |
| Druid Champion | Purchase the first 12 faction upgrades in this game (this includes Trade Treaty, Friendship Pact, and Alliance) | 未标注 | 未标注 | 未标注 | 未实现 |
| Faceless Champion | Purchase the first 12 faction upgrades in this game (this includes Trade Treaty, Friendship Pact, and Alliance) | 未标注 | 未标注 | 未标注 | 未实现 |
| Dwarven Champion | Purchase the first 12 faction upgrades in this game (this includes Trade Treaty, Friendship Pact, and Alliance) | 未标注 | 未标注 | 未标注 | 未实现 |
| Drow Champion | Purchase the first 12 faction upgrades in this game (this includes Trade Treaty, Friendship Pact, and Alliance) | 未标注 | 未标注 | 未标注 | 未实现 |
| Mercenary Champion | Purchase all Mercenary Upgrades | 未标注 | 未标注 | 未标注 | 未实现 |
| Dragon Champion | Purchase the first 12 faction upgrades in this game (this includes Trade Treaty, Friendship Pact, and Alliance) | 未标注 | 未标注 | 未标注 | 未实现 |
| Archon Champion | Purchase the first 12 faction upgrades in this game (this includes Trade Treaty, Friendship Pact, and Alliance) | 未标注 | 未标注 | 未标注 | 未实现 |
| Djinn Champion | Purchase the first 12 faction upgrades in this game (this includes Trade Treaty, Friendship Pact, and Alliance) | 未标注 | 未标注 | 未标注 | 未实现 |
| Makers Champion | Purchase the first 12 faction upgrades in this game (this includes Trade Treaty, Friendship Pact, and Alliance) | 未标注 | 未标注 | 未标注 | 未实现 |
| Mercenary Oath You have become a Mercenary for the rest of your existence. | Purchase Mercenary Tribute & Oath of the Mercenaries. | 未标注 | 未标注 | 未标注 | 未实现 |
| Fairy Grand Champion | R60+, Upgrade Fairy Lineage to level 20 and purchase the first 3 Fairy Lineage perks. | 未标注 | 未标注 | 未标注 | 未实现 |
| Elven Grand Champion | R60+, Upgrade Elven Lineage to level 20 and purchase the first 3 Elven Lineage perks. | 未标注 | 未标注 | 未标注 | 未实现 |
| Angel Grand Champion | R60+, Upgrade Angel Lineage to level 20 and purchase the first 3 Angel Lineage perks. | 未标注 | 未标注 | 未标注 | 未实现 |
| Goblin Grand Champion | R60+, Upgrade Goblin Lineage to level 20 and purchase the first 3 Goblin Lineage perks. | 未标注 | 未标注 | 未标注 | 未实现 |
| Undead Grand Champion | R60+, Upgrade Undead Lineage to level 20 and purchase the first 3 Undead Lineage perks. | 未标注 | 未标注 | 未标注 | 未实现 |
| Demon Grand Champion | R60+, Upgrade Demon Lineage to level 20 and purchase the first 3 Demon Lineage perks. | 未标注 | 未标注 | 未标注 | 未实现 |
| Titan Grand Champion | R60+, Upgrade Titan Lineage to level 20 and purchase the first 3 Titan Lineage perks. | 未标注 | 未标注 | 未标注 | 未实现 |
| Druid Grand Champion | R60+, Upgrade Druid Lineage to level 20 and purchase the first 3 Druid Lineage perks. | 未标注 | 未标注 | 未标注 | 未实现 |
| Faceless Grand Champion | R60+, Upgrade Faceless Lineage to level 20 and purchase the first 3 Faceless Lineage perks. | 未标注 | 未标注 | 未标注 | 未实现 |
| Dwarven Grand Champion | R60+, Upgrade Dwarven Lineage to level 20 and purchase the first 3 Dwarven Lineage perks. | 未标注 | 未标注 | 未标注 | 未实现 |
| Drow Grand Champion | R60+, Upgrade Drow Lineage to level 20 and purchase the first 3 Drow Lineage perks. | 未标注 | 未标注 | 未标注 | 未实现 |
| Dragon Grand Champion | R60+, Upgrade Dragon Lineage to level 20 and purchase the first 3 Dragon Lineage perks. | 未标注 | 未标注 | 未标注 | 未实现 |
| Fairy Master | A2, Reach lineage level 30 and purchase all Fairy Upgrades | 未标注 | 未标注 | A2, Reach lineage level 30 and purchase all | 未实现 |
| Elven Master | A2, Reach lineage level 30 and purchase all Elven Upgrades | 未标注 | 未标注 | A2, Reach lineage level 30 and purchase all | 未实现 |
| Angel Master | A2, Reach lineage level 30 and purchase all Angel Upgrades | 未标注 | 未标注 | A2, Reach lineage level 30 and purchase all | 未实现 |
| Goblin Master | A2, Reach lineage level 30 and purchase all Goblin Upgrades | 未标注 | 未标注 | A2, Reach lineage level 30 and purchase all | 未实现 |
| Undead Master | A2, Reach lineage level 30 and purchase all Undead Upgrades | 未标注 | 未标注 | A2, Reach lineage level 30 and purchase all | 未实现 |
| Demon Master | A2, Reach lineage level 30 and purchase all Demon Upgrades | 未标注 | 未标注 | A2, Reach lineage level 30 and purchase all | 未实现 |
| Titan Master | A2, Reach lineage level 30 and purchase all Titan Upgrades | 未标注 | 未标注 | A2, Reach lineage level 30 and purchase all | 未实现 |
| Druid Master | A2, Reach lineage level 30 and purchase all Druid Upgrades | 未标注 | 未标注 | A2, Reach lineage level 30 and purchase all | 未实现 |
| Faceless Master | A2, Reach lineage level 30 and purchase all Faceless Upgrades | 未标注 | 未标注 | A2, Reach lineage level 30 and purchase all | 未实现 |
| Dwarven Master | A2, Reach lineage level 30 and purchase all Dwarven Upgrades | 未标注 | 未标注 | A2, Reach lineage level 30 and purchase all | 未实现 |
| Drow Master | A2, Reach lineage level 30 and purchase all Drow Upgrades | 未标注 | 未标注 | A2, Reach lineage level 30 and purchase all | 未实现 |
| Dragon Master | A2, Reach lineage level 30 and purchase all Dragon Upgrades | 未标注 | 未标注 | A2, Reach lineage level 30 and purchase all | 未实现 |


## 4.MiscTrophies-map

| 原名称 | 原版条件 | 原版成本 | 原版 Buff／公式 | 原版升阶修正 | 当前状态 |
| --- | --- | --- | --- | --- | --- |
| A Thousand Coins | Gain 1,000 coins in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| A Million Coins | Gain 1 M (1E6) coins in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| A Billion Coins | Gain 1 B (1E9) coins in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| A Trillion Coins | Gain 1 T (1E12) coins in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| A Quadrillion Coins | Gain 1 Qa (1E15) coins in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| A Quintillion Coins | Gain 1 Qi (1E18) coins in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| A Sextillion Coins | Gain 1 Sx (1E21) coins in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| A Septillion Coins | Gain 1 Sp (1E24) coins in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| An Octillion Coins | Gain 1 Oc (1E27) coins in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| A Nonillion Coins | Gain 1 No (1E30) coins in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| A Decillion Coins | Gain 1 Dc (1E33) coins in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Countless Coins | Gain 1 Ud (1E36) coins in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Infinite Coins | Gain 1 Uvg (1E66) coins in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Unlimited Coins | Gain 1 Qivg (1E78) coins in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Endless Coins | Gain 1 Tg (1E93) coins in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Coins Galore | Gain 1 Qitg (1E108) coins in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Coin Multiplication | Gain 1 Qag (1E123) coins in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Coin Hemisphere | Gain 1 Qig (1E153) coins in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Coin World | Gain 1 SxSxg (1E201) coins in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Coin Universe | Gain 1 Ocg (1E243) coins in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Treasure Clicker | Gain 100 coins by clicking in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Treasure Finder | Gain 1,000 coins by clicking in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Treasure Digger | Gain 1 M (1E6) coins by clicking in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Treasure Hunter | Gain 1 B (1E9) coins by clicking in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Treasure Seeker | Gain 1 T (1E12) coins by clicking in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Treasure Master | Gain 1 Qa (1E15) coins by clicking in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Treasure Hero | Gain 1 Qi (1E18) coins by clicking in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Treasure Legend | Gain 1 Sx (1E21) coins by clicking in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Treasure Grinder | Gain 1 Sp (1E24) coins by clicking in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Treasure Breaker | Gain 1 Ud (1E36) coins by clicking in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Treasure Smasher | Gain 1 Qad (1E45) coins by clicking in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Treasure Destroyer | Gain 1 Spd (1E54) coins by clicking in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Treasure Annihilator > | Gain 1 Vg (1E63) coins by clicking in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Treasure Disintegrator | Gain 1 Qivg (1E78) coins by clicking in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Treasure Ender | Gain 1 Tg (1E93) coins by clicking in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Treasure Unmaker | Gain 1 Qitg (1E108) coins by clicking in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Treasure Nullifier | Gain 1 Qag (1E123) coins by clicking in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Treasure Wrecker | Gain 1 Qig (1E153) coins by clicking in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Treasure Obliterator | Gain 1 SxSxg (1E201) coins by clicking in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| A Clicking Start | Click the background 100 Times in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Clicking More | Click the background 500 Times in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Click Clock | Click the background 1,000 Times in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Clicking Forward | Click the background 2,500 Times in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Clicking Frenzy | Click the background 5,000 Times in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| World of Clicks | Click the background 10,000 Times in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| The Clicky Way | Click the background 20,000 Times in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Clicker Eternal | Click the background 50,000 Times in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Realm Clicker | Click the background 100,000 Times in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Faction Coin | Find 1 Faction Coin in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 50 Faction Coins | Find 50 Faction Coins in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 250 Faction Coins | Find 250 Faction Coins in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1000 Faction Coins | Find 1,000 Faction Coins in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 5000 Faction Coins | Find 5,000 Faction Coins in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 10000 Faction Coins | Find 10,000 Faction Coins in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 50000 Faction Coins | Find 50,000 Faction Coins in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 100000 Faction Coins | Find 100,000 Faction Coins in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 500000 Faction Coins | Find 500,000 Faction Coins in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Million Faction Coins | Find 1 M (1E6) Faction Coins in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 100 Million Faction Coins | Find 100 M (1E8) Faction Coins in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Billion Faction Coins | Find 1 B (1E9) Faction Coins in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 100 Billion Faction Coins | Find 100 B (1E11) Faction Coins in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Trillion Faction Coins | Find 1 T (1E12) Faction Coins in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 100 Trillion Faction Coins | Find 100 T (1E14) Faction Coins in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Quadrillion Faction Coins | Find 1 Qa (1E15) Faction Coins in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Quintillion Faction Coins | Find 1 Qi (1E18) Faction Coins in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Sextillion Faction Coins | Find 1 Sx (1E21) Faction Coins in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Nonillion Faction Coins | Find 1 No (1E30) Faction Coins in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Tredecillion Faction Coins | Find 1 Td (1E42) Faction Coins in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Septendecillion Faction Coins | Find 1 Spd (1e54) Faction Coins in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Assistant Solo | Have 1 Assistant in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Assistant Group | Have 10 Assistants in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Assistant Commando | Have 50 Assistants in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Assistant Squad | Have 100 Assistants in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Assistant Army | Have 200 Assistants in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Assistant Legion | Have 300 Assistants in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Assistant Horde | Have 500 Assistants in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Assistant Host | Have 1,000 Assistants in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Assistant Clump | Have 2,000 Assistants in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Assistant Nation | Have 5,000 Assistants in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Assistant Kingdom | Have 10,000 Assistants in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Assistant Continent | Have 25,000 Assistants in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Assistant World | Have 50,000 Assistants in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Assistant Galaxy | Have 500,000 Assistants in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Assistant Universe | Have 5,000,000 (5e6) Assistants in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Assistant Dimension | Have 5 B (5e9) Assistants in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Assistant Multiverse | Have 5 T (5e12) Assistants in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Assistant Stratum | Have 5 Qi (5e18) Assistants in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Artifact | Find 1 Artifact (All Time). | 未标注 | 未标注 | 未标注 | 未实现 |
| 5 Artifacts | Find 5 Artifacts (All Time). | 未标注 | 未标注 | 未标注 | 未实现 |
| 10 Artifacts | Find 10 Artifacts (All Time). | 未标注 | 未标注 | 未标注 | 未实现 |
| 20 Artifacts | Find 20 Artifacts (All Time). | 未标注 | 未标注 | 未标注 | 未实现 |
| 35 Artifacts | Find 35 Artifacts (All Time). | 未标注 | 未标注 | 未标注 | 未实现 |
| 50 Artifacts | Find 50 Artifacts (All Time). | 未标注 | 未标注 | 未标注 | 未实现 |
| 75 Artifacts | Find 75 Artifacts (All Time). | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Gem | Gain 1 Gem (Total). | 未标注 | 未标注 | 未标注 | 未实现 |
| 50 Gems | Gain 50 Gems (Total). | 未标注 | 未标注 | 未标注 | 未实现 |
| 150 Gems | Gain 150 Gems (Total). | 未标注 | 未标注 | 未标注 | 未实现 |
| 500 Gems | Gain 500 Gems (Total). | 未标注 | 未标注 | 未标注 | 未实现 |
| 1000 Gems | Gain 1,000 Gems (Total). | 未标注 | 未标注 | 未标注 | 未实现 |
| 5000 Gems | Gain 5,000 Gems (Total). | 未标注 | 未标注 | 未标注 | 未实现 |
| 15000 Gems | Gain 15,000 Gems (Total). | 未标注 | 未标注 | 未标注 | 未实现 |
| 50000 Gems | Gain 50,000 Gems (Total). | 未标注 | 未标注 | 未标注 | 未实现 |
| 100000 Gems | Gain 100,000 Gems (Total). | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Billion Gems | Gain 1 B (1E9) Gems (Total). | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Quadrillion Gems | Gain 1 Qa (1E15) Gems (Total). | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Sextillion Gems | Gain 1 Sx (1E21) Gems (Total). | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Nonillion Gems | Gain 1 No (1E30) Gems (Total). | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Duodecillion Gems | Gain 1 Dd (1E39) Gems (Total). | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Quindecillion Gems | Gain 1 Qid (1E48) Gems (Total). | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Octodecillion Gems | Gain 1 Ocd (1E57) Gems (Total). | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Unvigintillion Gems | Gain 1 Uvg (1E66) Gems (Total). | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Quadravigintillion Gems | Gain 1 Qavg (1E75) Gems (Total). | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Septenvigintillion Gems | Gain 1 Spvg (1E84) Gems (Total). | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Trigintillion Gems | Gain 1 Tg (1E93) Gems (Total). | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Tretrigintillion Gems | Gain 1 Ttg (1E102) Gems (Total). | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Sextrigintillion Gems | Gain 1 Sxtg (1E111) Gems (Total). | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Unquadragintillion Gems | Gain 1 Uqag (1E126) Gems (Total). | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Ruby | Gain 1 Ruby (All time). | 未标注 | 未标注 | 未标注 | 未实现 |
| 10 Rubies | Gain 10 Rubies (All time). | 未标注 | 未标注 | 未标注 | 未实现 |
| 25 Rubies | Gain 25 Rubies (All time). | 未标注 | 未标注 | 未标注 | 未实现 |
| 50 Rubies | Gain 50 Rubies (All time). | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Upgrade | Purchase 1 Upgrade in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 5 Upgrades | Purchase 5 Upgrades in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 15 Upgrades | Purchase 15 Upgrades in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 30 Upgrades | Purchase 30 Upgrades in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 50 Upgrades | Purchase 50 Upgrades in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 85 Upgrades | Purchase 85 Upgrades in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 120 Upgrades | Purchase 120 Upgrades in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 175 Upgrades | Purchase 175 Upgrades in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 235 Upgrades | Purchase 235 Upgrades in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 305 Upgrades | Purchase 305 Upgrades in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 385 Upgrades | Purchase 385 Upgrades in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Reincarnation | Reincarnate 1 time. | (To Reincarnate to R1) 1 Oc (1e27) Gems | 未标注 | 未标注 | 未实现 |
| 3 Reincarnations | Reincarnate 3 times. | (To Reincarnate to R3) 1 Dc (1e33) Gems | 未标注 | 未标注 | 未实现 |
| 5 Reincarnations | Reincarnate 5 times. | (To Reincarnate to R5) 1 Dd (1e39) Gems | 未标注 | 未标注 | 未实现 |
| 7 Reincarnations | Reincarnate 7 times. | (To Reincarnate to R7) 1 Qad (1e45) Gems | 未标注 | 未标注 | 未实现 |
| 10 Reincarnations | Reincarnate 10 times. | (To Reincarnate to R10) 1 Spd (1e54) Gems | 未标注 | 未标注 | 未实现 |
| 12 Reincarnations | Reincarnate 12 times. | (To Reincarnate to R12) 1 Nod (1e60) Gems | 未标注 | 未标注 | 未实现 |
| 15 Reincarnations | Reincarnate 15 times. | (To Reincarnate to R15) 1 Dvg (1e69) Gems | 未标注 | 未标注 | 未实现 |
| 20 Reincarnations | Reincarnate 20 times. | (To Reincarnate to R20) 1 Spvg (1e84) Gems | 未标注 | 未标注 | 未实现 |
| 25 Reincarnations | Reincarnate 25 times. | (To Reincarnate to R25) 1 Dtg (1e99) Gems | 未标注 | 未标注 | 未实现 |
| 30 Reincarnations | Reincarnate 30 times | (To Reincarnate to R30) 1 Sptg (1e114) Gems | 未标注 | 未标注 | 未实现 |
| 35 Reincarnations | Reincarnate 35 times | (To Reincarnate to R35) 1 Dqag (1e129) Gems | 未标注 | 未标注 | 未实现 |
| 40 Reincarnations | Reincarnate 40 times | (To Reincarnate to R40) 1 Spqag (1e144) Gems | 未标注 | 未标注 | 未实现 |
| 45 Reincarnations | Reincarnate 45 times | (To Reincarnate to R45) 17.78 Oc Sp (1.778e28) Gems | 未标注 | 未标注 | 未实现 |
| 50 Reincarnations | Reincarnate 50 times | (To Reincarnate to R50) 177.8 Ud (1.778e38) Gems | 未标注 | 未标注 | 未实现 |
| 60 Reincarnations | Reincarnate 60 times | (To Reincarnate to R60) 17.78 Ocd (1.778e58) Gems | 未标注 | 未标注 | 未实现 |
| 70 Reincarnations | Reincarnate 70 times | (To Reincarnate to R70) 1.778 Qivg (1.778e78) Gems | 未标注 | 未标注 | 未实现 |
| 85 Reincarnations | Reincarnate 85 times | (To Reincarnate to R85) 1.778 Qitg (1.778e108) Gems | 未标注 | 未标注 | 未实现 |
| 100 Reincarnations | Reincarnate 100 times | (To Reincarnate to R100) 1.778 Qiqag (1.778e138) Gems | 未标注 | 未标注 | 未实现 |
| 125 Reincarnations | Reincarnate 125 times | (To Reincarnate to R125) 31.05 Dvg (3.105e70) Gems | 未标注 | 未标注 | 未实现 |
| 150 Reincarnations | Reincarnate 150 times | (To Reincarnate to R150) 1.134 Dqag (1.134e129) Gems | 未标注 | 未标注 | 未实现 |
| Archaeology Expedition | You have funded an archaeology expedition to find relics of the Ancient Races. (Excavate for 1st time.) | 未标注 | 未标注 | 未标注 | 未实现 |
| Clouded | Register your realm in the Cloud Service! In the Options | 未标注 | 未标注 | 未标注 | 未实现 |
| Vanilla Challenger | Complete all the Vanilla Faction Challenges. | 1 coins, A1+ Free | Increase the overall production of Vanilla Factions by 25%. | A1+ Free | 未实现 |
| Neutral Challenger | Complete all the Neutral Faction Challenges. | 10 coins, A1+ Free | Increase the overall production of Neutral Factions by 25%. | A1+ Free | 未实现 |
| Prestige Challenger | Complete all the Prestige Challenges, R63+ | 10, A2+ Free | Increase the overall production of Prestige Factions by 25%. | A2+ Free | 未实现 |
| Elite Challenger | Complete all the MAD Challenges, R153+ | 10, A3+ Free | Increase the overall production of Elite Factions by 25%. | A3+ Free | 未实现 |
| Novice Researcher | Research 600 times across all fields. | 1 Tqag (1e132), A1+ Free | Increase the overall production of Vanilla Factions by 100%. (A Nerfed) | A1+ Free；A Nerfed | 未实现 |
| Intermediate Researcher | Research 1800 times across all fields. | 1 QiQig (1e168), A1+ Free | Increases the production of all Neutral Factions by 100%. (A Nerfed) | A1+ Free；A Nerfed | 未实现 |
| Expert Researcher | Research 2750 times across all fields. | 1 QiQig (1e168), A1+ Free Effect Increase the overall production of Prestige Factions by 100%. (A Nerfed) | 未标注 | A1+ Free；A Nerfed | 未实现 |
| Master Researcher | Research 10000 times across all fields. | 1 Qavg (1e75), A2+ Free | Increase the overall production of Dragons by 100%. | A2+ Free | 未实现 |
| Grandmaster Researcher | Research 18500 times across all fields. | 10 SpQig (1e175), A2+ Free | Increase the overall production of Mercenaries by 150%. | A2+ Free | 未实现 |
| Vanilla Researcher | Discover all the Vanilla Faction researches. | 1 SpQig (1e174), A1+ Free | Increase the production of all buildings based on research done.；(0.3 * x ^ 0.7)%, where x is amount of research done. | A1+ Free | 未实现 |
| Ancient Researcher | Discover all the Ancient Races researches. | 1 NoSxg (1e210), A1+ Free | Increase the production of all buildings based on research done.；(0.3 * x ^ 0.7)%, where x is amount of research done. | A1+ Free | 未实现 |
| Underworld Researcher | Discover all the Underworld researches. | 1 NoSxg (1e210), A1+ Free | Increase the production of all buildings based on research done.；(0.3 * x ^ 0.7)%, where x is amount of research done. | A1+ Free | 未实现 |
| Eternal Researcher | Discover all the Dragon researches, R55+ | 1 Novg (1e90), A2+ Free | Increase the production of all buildings based on research done.；(0.3 * x ^ 0.7)%, where x is amount of research done. | A2+ Free | 未实现 |
| Warrior Researcher | Discover all the Mercenary researches | 1 DSpg (1e219), A2+ Free | Increase the production of all buildings based on research done.；(0.3 * x ^ 0.7)%, where x is amount of research done. Upgrade : Good for Mercenary. | A2+ Free | 未实现 |
| Novice Combinator | R220+, Purchase Legacies from 4 different factions in a single game. | 1 Qavg (1e75) | Increase the production of all buildings based on time spent with the least used alignment.；(50 + 0.7 * x ^ 0.7)%, where x is time spent with your least used alignment. | 未标注 | 未实现 |
| Expert Combinator | R220+, Purchase Legacies from 6 different factions in a single game. | 10 Dtg (1e100) | Increase the production of all buildings based on time spent with the least used alignment.；(50 + 0.7 * x ^ 0.7)%, where x is time spent with your least used alignment. | 未标注 | 未实现 |


## 4.MagicTrophies-map

| 原名称 | 原版条件 | 原版成本 | 原版 Buff／公式 | 原版升阶修正 | 当前状态 |
| --- | --- | --- | --- | --- | --- |
| Mana Droplet | Produce 200 mana (Total) | 10,000, A1+ Free | Increase Mana Regeneration by +0.50. | A1+ Free | 未实现 |
| Mana Rain | Produce 2,000 mana (Total) | 20 M (2e7), A1+ Free | Increase Mana Regeneration by +0.50. | A1+ Free | 未实现 |
| Mana Surge | Produce 5,000 mana (Total) | 30 B (3e10), A1+ Free | Increase Mana Regeneration by +0.50. | A1+ Free | 未实现 |
| Mana Fountain | Produce 10,000 mana (Total) | 40 T (4e13), A1+ Free | Increase Mana Regeneration by +0.50. | A1+ Free | 未实现 |
| Mana Shower | Produce 20,000 mana (Total) | 50 Qa (5e16), A1+ Free | Increase Mana Regeneration by +0.50. | A1+ Free | 未实现 |
| Mana Stream | Produce 100,000 mana (Total) | 60 Qi (6e19), A1+ Free | Increase Mana Regeneration by +0.50. | A1+ Free | 未实现 |
| Mana Flood | Produce 200,000 mana (Total) | 70 Sx (7e22), A1+ Free | Increase Mana Regeneration by +0.50. | A1+ Free | 未实现 |
| Mana Wave | Produce 20 M (20e6) mana (Total), R40+ | 80 Sp (8e25), A2+ Free | Increase Mana Regeneration by +50.00. | A2+ Free | 未实现 |
| Mana River | Produce 1 B (1e9) mana (Total), R40+ | 90 Oc (9e28), A2+ Free | Increase Mana Regeneration by +50.00. | A2+ Free | 未实现 |
| Mana Lake | Produce 20B (2e10) mana (Total), R40+ | 100 No (1e32), A2+ Free | Increase Mana Regeneration by +50.00. | A2+ Free | 未实现 |
| Mana Sea | Produce 1 T (1e12) mana (Total), R40+ | 12.5 Uqag No (1.25e127), A2+ Free | Increase Mana Regeneration by +50.00. | A2+ Free | 未实现 |
| Mana Ocean | Produce 2 T (2e12) mana (Total), R40+ | 150 Noqag (1.5e152), A2+ Free | Increase Mana Regeneration by +50.00. | A2+ Free | 未实现 |
| Mana Spring | R100+, Produce 100 T (1e14) mana (Total) | 1 Sp (1e24), A3+ Free | Increase Mana Regeneration by +100.00. | A3+ Free | 未实现 |
| Mana Falls | R100+, Produce 200 Qi (2e20) mana (Total) | 10 Dqag (1e130), A3+ Free | Increase Mana Regeneration by +100.00. | A3+ Free | 未实现 |
| Magic User | 10 spell casts in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Magic Abuser | 100 spell casts in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Spell Prodigy | 500 spells casts in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Mana Leaker | 1,000 spell casts in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Mana Eraser | 2,000 spell casts in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Autocaster | 5,000 spell casts in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Spell Spammer | 20,000 spell casts in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Mana Annihilator | 50,000 spell casts in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Master Channeler | 100,000 spell casts in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Caster Supreme | 200,000 spell casts in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Spell Superiority | 500,000 spell casts in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Massive Autocaster | 1 M (1e6) spell casts in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Spell Weaver | 50 M (5e7) spell casts in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Archwizard | 1 B (1e9) spell casts in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Spell Master | Cast 50 T (5e13) spells in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Spell Grinder | Cast 10 Qa (1e16) spells in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Automatic Casting | 60,000 Mana Produced (Total this R) | 100 B (1e11), A1+ Free | Allows autocasting of spells by CTRL+Clicking them.；While offline, spells are not cast, instead increases mana produced amount by 10% of your Mana Regeneration per second. | A1+ Free | 未实现 |
| Improved Autocasting | 2 M (2e6) Mana Produced (Total this R) | 200 Qi (2e20), A1+ Free | Multiplicatively increases Mana Regeneration by 5%.；While offline, increases mana produced amount by an additional 15% of your Mana Regeneration per second. | A1+ Free | 未实现 |
| Masterful Autocasting | 6 M (6e6) Mana Produced (Total this R) | 300 Oc (3E29), A1+ Free | Multiplicatively increases Mana Regeneration by 10%.；While offline, increases mana produced amount by an additional 35% of your mana regeneration per second. | A1+ Free | 未实现 |
| Priority Autocasting | 12 M (1.2e7) Mana Produced (Total this R) | 400 Ud (4e38), A1+ Free | Allows you to prioritize the order of spell casting.；While offline, improves spell cast amount by 1 per minute. | A1+ Free | 未实现 |
| Contingency Autocasting | 20 M (2e7) Mana Produced (Total this R) | 500 Qad (5e47), A1+ Free | Allows you to set a minimum amount of mana before starting to Autocast.；While offline, improves spell cast amount by an additional 2 per minute. | A1+ Free | 未实现 |
| Planned Autocasting | 30 M (3e7) Mana Produced (Total this R) | 600 Spd (6e56), A1+ Free | Allows you to set Primary and Secondary spells.；While offline, increases mana produced by an additional 10% of your mana regeneration per second and your spells cast amount by an additional 2 per minute. | A1+ Free | 未实现 |
| Efficient Autocasting | 50 M (5E7) Mana Produced (Total this R) | 700 Vg (7E65), A1+ Free | Allows you to select Independent Spells,；While offline, increases mana produced amount by an additional 10% of your mana regen per second and spell cast amount by 2 per minute. | A1+ Free | 未实现 |
| Reverse Autocasting | R40+, 150 M (1.5e8) Mana Produced (Total this R) | 3.2 Dc (3.2e33), A2+: Free | Allows you to manually reset spells with a 2 second cooldown per spell.；(1000 * log10(1 + x)), where x is mana regeneration | 未标注 | 未实现 |
| Tiered Autocasting | R40+, 200 M Mana Produced (Total this R). | 100 Qid (1.0e50), A2+ Free | Allows you to set the maximum tier you wish to autocast each spell to.；Only while offline, increase mana produced by an additional 10% (for a total of 90%) of your mana regeneration per second and your spells cast amount multiplicatively based on your offline mana regeneration.；(1000 * log10(1 + x)), where x is offline mana regeneration | A2+ Free | 未实现 |
| Arcane Brilliance 1 | Unlock tier 2 for all spells | 未标注 | 未标注 | 未标注 | 未实现 |
| Arcane Brilliance 2 | Unlock tier 3 for all spells | 未标注 | 未标注 | 未标注 | 未实现 |
| Arcane Brilliance 3 | Unlock tier 4 for all spells | 未标注 | 未标注 | 未标注 | 未实现 |
| Arcane Brilliance 4 | Unlock tier 5 for all spells | 未标注 | 未标注 | 未标注 | 未实现 |
| Arcane Brilliance 5 | Unlock tier 6 for all spells | 未标注 | 未标注 | 未标注 | 未实现 |
| Arcane Brilliance 6 | Unlock tier 7 for all spells | 未标注 | 未标注 | 未标注 | 未实现 |
| Coin Pillage | Cast 150 Tax Collections in less than 5 seconds. | 1 Dc (1e33), A1+ Free | Tax Collection also finds 30 seconds worth of Faction Coins. | A1+ Free | 部分接入：附加影响力已接入；“5 秒内 150 次”的完整时间窗未实现 |
| Fairy Choir | Cast Fairy Chanting while having 45 or more assistants. | 1 M (1e6), A1+ Free | Fairy Chanting triples your assistants for its duration. | A1+ Free | 部分接入：条件与三倍数字员工效果已接入；无原版购买成本流程 |
| Sun Blessing | Activate the Moon Blessing spell after 6 am and before 1 pm (noon). | 1 M (1e6), A1+ Free | The treasure is autoclicked 15 times per second while Moon Blessing is active. | A1+ Free | 部分接入：时间条件与每秒 15 次自动点击已接入；无原版购买成本流程 |
| God's Rest | Cast God's Hand on any Sunday. | 1 M (1e6), A1+ Free | While this spell is active, you will find random Faction Coins based on your mana regen each time you cast an other spell. | A1+ Free | 部分接入：周日条件与其他法术提供影响力已接入；无原版购买成本流程 |
| Greed Drive | Goblin Spell: Cast 100 Goblin's Greed spells in a row in a single game. The chain is interrupted by casting different spells. | 1 M (1e6), A1+ Free | Goblin's Greed cost 150 less mana. | A1+ Free | 部分接入：仅技能减耗 Buff；连续 100 次且不使用其他法术的完整条件未实现 |
| True Night | Undead Spell: Activate the Night Time spell after 11 pm and before 6 am. | 1 M (1e6), A1+ Free | Increase Night Time boost to assistants production to 40% per Necropolis. | A1+ Free | 部分接入：夜间条件与 40% 强化已接入；无原版购买成本流程 |
| Hell Rush | Cast Hellfire Blast in the first 60 seconds of playtime | 1 M (1e6), A1+ Free | Hellfire Blast also boost Halls of Legends | A1+ Free | 部分接入：前 60 秒条件与传奇工位强化已接入；无原版购买成本流程 |
| Lightning Storm | Cast Lightning Strike 100 times in a single game. | 10 Dd (1e40), A1+ Free | Increase Lightning Strike multiplier to 750% per Iron Stronghold | A1+ Free | 部分接入：100 次条件与 750% 强化已接入；无原版购买成本流程 |
| Halls of Balance | Have Grand Balance affect Hall of Legends | 10 Dd (1e40), A1+ Free | Increase Grand Balance duration by 4 seconds and lower its cost by 200 mana | A1+ Free | 部分接入：目标条件、持续时间和减耗已接入；无原版购买成本流程 |
| Faceless Overmind | Affiliate with the Faceless 5 times in a row. (Buy Faceless Trade Treaty 5x in a row) | 10 Dd (1e40), A1+ Free | Increase Brainwave tick to 3% per second | A1+ Free | 部分接入：连续加入与每秒 3% 强化已接入；无原版购买成本流程 |
| Minedwarf | Find 30,000 Faction Coins from Diamond Pickaxe in a single game. | 100 Sxd (1e53), A1+ Free | Increases Diamond Pickaxe bonus to 'Faction Coin Find Chance' to 300%. | A1+ Free | 部分接入：审计影响力计数与强化已接入；无原版购买成本流程 |
| Perfect Combo | Cast a chain of 100 Combo Strikes in a single game. The chain is interrupted by casting a different spell. | 100 Sxd (1e53), A1+ Free | Increases Combo Strike bonus.；(40 * x ^ 0.9)%, where x is the number of times you have cast Combo Strike. | A1+ Free | 部分接入：强化公式已接入；连续释放被其他法术打断的完整判定未实现 |
| Dragon's Roar | Cast Dragon's Breath while having at least 4 other active spells. | 1.0e45, A2+ Free | Dragon's Breath multiplicatively increases Faction Coin find chance based on its duration.；(6 * x ^ 0.6)%, where x is duration in seconds | A2+ Free | 未实现 |
| Chrono Loading | R125+, Cast Precognition with at least 100 Qa (1e17) mana regeneration. | 10 Octg (1e118), A3+ Free | A fraction of Precognition duration is added to time spent in this game.；Scale off invisible spell duration modifiers.；(100 * ln(1 + x / 60) ^ 2.5), where x is its duration. | A3+ Free | 未实现 |
| Persistent Entropy | R125+, Cast Limited Wish 100 times within 30 minutes of a new game. | 10 Octg (1e118), A3+ Free | Also adds 150 casts to Limited wish formula. | A3+ Free | 未实现 |
| Reality Crater | R125+, Cast Infinite Spiral with at least 10 excavation resets this game. | 10 Octg (1e118), A3+ Free | Infinite Spiral also reduces excavation cost multiplier based on assistants owned.；(0.001 * log(1 + x)), where x is assistants owned. | A3+ Free | 未实现 |


## 4.BuildingTrophies-map

| 原名称 | 原版条件 | 原版成本 | 原版 Buff／公式 | 原版升阶修正 | 当前状态 |
| --- | --- | --- | --- | --- | --- |
| 1 Farm Trophies | Build 1 Farm in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 50 Farm Trophies | Build 50 Farms in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 100 Farm Trophies | Build 100 Farms in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 150 Farm Trophies | Build 150 Farms in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 200 Farm Trophies | Build 200 Farms in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 300 Farm Trophies | Build 300 Farms in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 400 Farm Trophies | Build 400 Farms in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 500 Farm Trophies | Build 500 Farms in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 600 Farm Trophies | Build 600 Farms in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 700 Farm Trophies | Build 700 Farms in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 800 Farm Trophies | Build 800 Farms in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 900 Farm Trophies | Build 900 Farms in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1000 Farm Trophies | Build 1000 Farms in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1500 Farm Trophies | Build 1500 Farms in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 2000 Farm Trophies | Build 2000 Farms in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 2500 Farm Trophies | Build 2500 Farms in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 3000 Farm Trophies | Build 3000 Farms in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 3500 Farm Trophies | Build 3500 Farms in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 5000 Farm Trophies | Build 5000 Farms in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 7500 Farm Trophies | Build 7500 Farms in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 12000 Farm Trophies | Build 12000 Farms in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 20000 Farm Trophies | Build 20000 Farms in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Inn Trophies | Build 1 Inn in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 50 Inn Trophies | Build 50 Inns in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 100 Inn Trophies | Build 100 Inns in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 150 Inn Trophies | Build 150 Inns in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 200 Inn Trophies | Build 200 Inns in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 300 Inn Trophies | Build 300 Inns in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 400 Inn Trophies | Build 400 Inns in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 500 Inn Trophies | Build 500 Inns in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 600 Inn Trophies | Build 600 Inns in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 700 Inn Trophies | Build 700 Inns in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 800 Inn Trophies | Build 800 Inns in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 900 Inn Trophies | Build 900 Inns in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1000 Inn Trophies | Build 1000 Inns in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1500 Inn Trophies | Build 1500 Inns in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 2000 Inn Trophies | Build 2000 Inns in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 2500 Inn Trophies | Build 2500 Inns in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 3000 Inn Trophies | Build 3000 Inns in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 3500 Inn Trophies | Build 3500 Inns in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 5000 Inn Trophies | Build 5000 Inns in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 7500 Inn Trophies | Build 7500 Inns in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 12000 Inn Trophies | Build 12000 Inns in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 20000 Inn Trophies | Build 20000 Inns in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Blacksmith | Build 1 Blacksmith in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 50 Blacksmith | Build 50 Blacksmiths in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 100 Blacksmith | Build 100 Blacksmiths in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 150 Blacksmith | Build 150 Blacksmiths in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 200 Blacksmith | Build 200 Blacksmiths in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 300 Blacksmith | Build 300 Blacksmiths in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 400 Blacksmith | Build 400 Blacksmiths in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 500 Blacksmith | Build 500 Blacksmiths in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 600 Blacksmith | Build 600 Blacksmiths in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 700 Blacksmith | Build 700 Blacksmiths in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 800 Blacksmith | Build 800 Blacksmiths in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 900 Blacksmith | Build 900 Blacksmiths in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1000 Blacksmith | Build 1000 Blacksmiths in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1500 Blacksmith | Build 1500 Blacksmiths in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 2000 Blacksmith | Build 2000 Blacksmiths in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 2500 Blacksmith | Build 2500 Blacksmiths in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 3000 Blacksmith | Build 3000 Blacksmiths in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 3500 Blacksmith | Build 3500 Blacksmiths in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 5000 Blacksmith | Build 5000 Blacksmiths in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 7500 Blacksmith | Build 7500 Blacksmiths in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 12000 Blacksmith | Build 12000 Blacksmiths in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 20000 Blacksmith | Build 20000 Blacksmiths in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Warrior Barrack | Build 1 Warrior Barrack in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 50 Warrior Barracks | Build 50 Warrior Barracks in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 100 Warrior Barracks | Build 100 Warrior Barracks in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 150 Warrior Barracks | Build 150 Warrior Barracks in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 200 Warrior Barracks | Build 200 Warrior Barracks in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 300 Warrior Barracks | Build 300 Warrior Barracks in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 400 Warrior Barracks | Build 400 Warrior Barracks in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 500 Warrior Barracks | Build 500 Warrior Barracks in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 600 Warrior Barracks | Build 600 Warrior Barracks in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 700 Warrior Barracks | Build 700 Warrior Barracks in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 800 Warrior Barracks | Build 800 Warrior Barracks in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 900 Warrior Barracks | Build 900 Warrior Barracks in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1000 Warrior Barracks | Build 1000 Warrior Barracks in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1500 Warrior Barracks | Build 1500 Warrior Barracks in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 2000 Warrior Barracks | Build 2000 Warrior Barracks in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 2500 Warrior Barracks | Build 2500 Warrior Barracks in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 3000 Warrior Barracks | Build 3000 Warrior Barracks in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 3500 Warrior Barracks | Build 3500 Warrior Barracks in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 5000 Warrior Barracks | Build 5000 Warrior Barracks in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 7500 Warrior Barracks | Build 7500 Warrior Barracks in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 12000 Warrior Barracks | Build 12000 Warrior Barracks in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 20000 Warrior Barracks | Build 20000 Warrior Barracks in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Slave Pen | Build 1 Slave Pen in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 50 Slave Pens | Build 50 Slave Pens in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 100 Slave Pens | Build 100 Slave Pens in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 150 Slave Pens | Build 150 Slave Pens in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 200 Slave Pens | Build 200 Slave Pens in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 300 Slave Pens | Build 300 Slave Pens in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 400 Slave Pens | Build 400 Slave Pens in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 500 Slave Pens | Build 500 Slave Pens in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 600 Slave Pens | Build 600 Slave Pens in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 700 Slave Pens | Build 700 Slave Pens in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 800 Slave Pens | Build 800 Slave Pens in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 900 Slave Pens | Build 900 Slave Pens in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1000 Slave Pens | Build 1000 Slave Pens in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1500 Slave Pens | Build 1500 Slave Pens in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 2000 Slave Pens | Build 2000 Slave Pens in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 2500 Slave Pens | Build 2500 Slave Pens in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 3000 Slave Pens | Build 3000 Slave Pens in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 3500 Slave Pens | Build 3500 Slave Pens in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 5000 Slave Pens | Build 5000 Slave Pens in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 7500 Slave Pens | Build 7500 Slave Pens in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 12000 Slave Pen s | Build 12000 Slave Pens in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 20000 Slave Pens | Build 20000 Slave Pens in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Knights Joust | Build 1 Knights Joust in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 50 Knights Jousts | Build 50 Knights Jousts in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 100 Knights Jousts | Build 100 Knights Jousts in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 150 Knights Jousts | Build 150 Knights Jousts in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 200 Knights Jousts | Build 200 Knights Jousts in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 300 Knights Jousts | Build 300 Knights Jousts in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 400 Knights Jousts | Build 400 Knights Jousts in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 500 Knights Jousts | Build 500 Knights Jousts in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 600 Knights Jousts | Build 600 Knights Jousts in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 700 Knights Jousts | Build 700 Knights Jousts in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 800 Knights Jousts | Build 800 Knights Jousts in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 900 Knights Jousts | Build 900 Knights Jousts in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1000 Knights Jousts | Build 1000 Knights Jousts in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1500 Knights Jousts | Build 1500 Knights Jousts in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 2000 Knights Jousts | Build 2000 Knights Jousts in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 2500 Knights Jousts | Build 2500 Knights Jousts in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 3000 Knights Jousts | Build 3000 Knights Jousts in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 3500 Knights Jousts | Build 3500 Knights Jousts in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 5000 Knights Jousts | Build 5000 Knights Jousts in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 7500 Knights Jousts | Build 7500 Knights Jousts in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 12000 Knights Jousts | Build 12000 Knights Jousts in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 20000 Knights Jousts | Build 20000 Knights Jousts in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Orcish Arena | Build 1 Orcish Arena in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 50 Orcish Arenas | Build 50 Orcish Arenas in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 100 Orcish Arenas | Build 100 Orcish Arenas in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 150 Orcish Arenas | Build 150 Orcish Arenas in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 200 Orcish Arenas | Build 200 Orcish Arenas in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 300 Orcish Arenas | Build 300 Orcish Arenas in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 400 Orcish Arenas | Build 400 Orcish Arenas in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 500 Orcish Arenas | Build 500 Orcish Arenas in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 600 Orcish Arenas | Build 600 Orcish Arenas in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 700 Orcish Arenas | Build 700 Orcish Arenas in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 800 Orcish Arenas | Build 800 Orcish Arenas in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 900 Orcish Arenas | Build 900 Orcish Arenas in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1000 Orcish Arenas | Build 1000 Orcish Arenas in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1500 Orcish Arenas | Build 1500 Orcish Arenas in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 2000 Orcish Arenas | Build 2000 Orcish Arenas in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 2500 Orcish Arenas | Build 2500 Orcish Arenas in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 3000 Orcish Arenas | Build 3000 Orcish Arenas in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 3500 Orcish Arenas | Build 3500 Orcish Arenas in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 5000 Orcish Arenas | Build 5000 Orcish Arenas in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 7500 Orcish Arenas | Build 7500 Orcish Arenas in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 12000 Orcish Arenas | Build 12000 Orcish Arenas in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 20000 Orcish Arenas | Build 20000 Orcish Arenas in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Wizard Tower | Build 1 Wizard Tower in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 50 Wizard Towers | Build 50 Wizard Towers in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 100 Wizard Towers | Build 100 Wizard Towers in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 150 Wizard Towers | Build 150 Wizard Towers in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 200 Wizard Towers | Build 200 Wizard Towers in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 300 Wizard Towers | Build 300 Wizard Towers in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 400 Wizard Towers | Build 400 Wizard Towers in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 500 Wizard Towers | Build 500 Wizard Towers in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 600 Wizard Towers | Build 600 Wizard Towers in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 700 Wizard Towers | Build 700 Wizard Towers in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 800 Wizard Towers | Build 800 Wizard Towers in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 900 Wizard Towers | Build 900 Wizard Towers in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1000 Wizard Towers | Build 1000 Wizard Towers in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1500 Wizard Towers | Build 1500 Wizard Towers in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 2000 Wizard Towers | Build 2000 Wizard Towers in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 2500 Wizard Towers | Build 2500 Wizard Towers in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 3000 Wizard Towers | Build 3000 Wizard Towers in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 3500 Wizard Towers | Build 3500 Wizard Towers in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 5000 Wizard Towers | Build 5000 Wizard Towers in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 7500 Wizard Towers | Build 7500 Wizard Towers in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 12000 Wizard Tower s | Build 12000 Wizard Towers in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 20000 Wizard Towers | Build 20000 Wizard Towers in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Witch Conclave | Build 1 Witch Conclave in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 50 Witch Conclaves | Build 50 Witch Conclaves in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 100 Witch Conclaves | Build 100 Witch Conclaves in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 150 Witch Conclaves | Build 150 Witch Conclaves in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 200 Witch Conclaves | Build 200 Witch Conclaves in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 300 Witch Conclaves | Build 300 Witch Conclaves in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 400 Witch Conclaves | Build 400 Witch Conclaves in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 500 Witch Conclaves | Build 500 Witch Conclaves in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 600 Witch Conclaves | Build 600 Witch Conclaves in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 700 Witch Conclaves | Build 700 Witch Conclaves in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 800 Witch Conclaves | Build 800 Witch Conclaves in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 900 Witch Conclaves | Build 900 Witch Conclaves in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1000 Witch Conclaves | Build 1000 Witch Conclaves in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1500 Witch Conclaves | Build 1500 Witch Conclaves in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 2000 Witch Conclaves | Build 2000 Witch Conclaves in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 2500 Witch Conclaves | Build 2500 Witch Conclaves in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 3000 Witch Conclaves | Build 3000 Witch Conclaves in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 3500 Witch Conclaves | Build 3500 Witch Conclaves in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 5000 Witch Conclaves | Build 5000 Witch Conclaves in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 7500 Witch Conclaves | Build 7500 Witch Conclaves in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 12000 Witch Conclaves | Build 12000 Witch Conclaves in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 20000 Witch Conclaves | Build 20000 Witch Conclaves in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Cathedral | Build 1 Cathedral in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 50 Cathedrals | Build 50 Cathedrals in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 100 Cathedrals | Build 100 Cathedrals in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 150 Cathedrals | Build 150 Cathedrals in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 200 Cathedrals | Build 200 Cathedrals in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 300 Cathedrals | Build 300 Cathedrals in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 400 Cathedrals | Build 400 Cathedrals in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 500 Cathedrals | Build 500 Cathedrals in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 600 Cathedrals | Build 600 Cathedrals in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 700 Cathedrals | Build 700 Cathedrals in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 800 Cathedrals | Build 800 Cathedrals in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 900 Cathedrals | Build 900 Cathedrals in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1000 Cathedrals | Build 1000 Cathedrals in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1500 Cathedrals | Build 1500 Cathedrals in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 2000 Cathedrals | Build 2000 Cathedrals in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 2500 Cathedrals | Build 2500 Cathedrals in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 3000 Cathedrals | Build 3000 Cathedrals in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 3500 Cathedrals | Build 3500 Cathedrals in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 5000 Cathedrals | Build 5000 Cathedrals in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 7500 Cathedrals | Build 7500 Cathedrals in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 12000 Cathedrals | Build 12000 Cathedrals in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 20000 Cathedrals | Build 20000 Cathedrals in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Dark Temple | Build 1 Dark Temple in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 50 Dark Temples | Build 50 Dark Temples in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 100 Dark Temples | Build 100 Dark Temples in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 150 Dark Temples | Build 150 Dark Temples in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 200 Dark Temples | Build 200 Dark Temples in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 300 Dark Temples | Build 300 Dark Temples in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 400 Dark Temples | Build 400 Dark Temples in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 500 Dark Temples | Build 500 Dark Temples in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 600 Dark Temples | Build 600 Dark Temples in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 700 Dark Temples | Build 700 Dark Temples in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 800 Dark Temple s | Build 800 Dark Temples in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 900 Dark Temples | Build 900 Dark Temples in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1000 Dark Temples | Build 1000 Dark Temples in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1500 Dark Temples | Build 1500 Dark Temples in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 2000 Dark Temples | Build 2000 Dark Temples in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 2500 Dark Temples | Build 2500 Dark Temples in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 3000 Dark Temples | Build 3000 Dark Temples in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 3500 Dark Temples | Build 3500 Dark Temples in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 5000 Dark Temples | Build 5000 Dark Temples in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 7500 Dark Temples | Build 7500 Dark Temples in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 12000 Dark Temples | Build 12000 Dark Temples in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 20000 Dark Temples | Build 20000 Dark Temples in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Citadel | Build 1 Citadel in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 50 Citadels | Build 50 Citadels in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 100 Citadels | Build 100 Citadels in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 150 Citadels | Build 150 Citadels in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 200 Citadels | Build 200 Citadels in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 300 Citadels | Build 300 Citadels in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 400 Citadels | Build 400 Citadels in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 500 Citadels | Build 500 Citadels in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 600 Citadels | Build 600 Citadels in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 700 Citadels | Build 700 Citadels in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 800 Citadels | Build 800 Citadels in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 900 Citadels | Build 900 Citadels in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1000 Citadels | Build 1000 Citadels in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1500 Citadels | Build 1500 Citadels in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 2000 Citadels | Build 2000 Citadels in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 2500 Citadels | Build 2500 Citadels in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 3000 Citadels | Build 3000 Citadels in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 3500 Citadels | Build 3500 Citadels in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 5000 Citadels | Build 5000 Citadels in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 7500 Citadels | Build 7500 Citadels in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 12000 Citadels | Build 12000 Citadels in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 20000 Citadels | Build 20000 Citadels in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Necropolis | Build 1 Necropolis in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 50 Necropolises | Build 50 Necropolises in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 100 Necropolises | Build 100 Necropolises in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 150 Necropolises | Build 150 Necropolises in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 200 Necropolises | Build 200 Necropolises in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 300 Necropolises | Build 300 Necropolises in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 400 Necropolises | Build 400 Necropolises in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 500 Necropolises | Build 500 Necropolises in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 600 Necropolises | Build 600 Necropolises in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 700 Necropolises | Build 700 Necropolises in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 800 Necropolises | Build 800 Necropolises in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 900 Necropolises | Build 900 Necropolises in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1000 Necropolises | Build 1000 Necropolises in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1500 Necropolises | Build 1500 Necropolises in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 2000 Necropolises | Build 2000 Necropolises in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 2500 Necropolises | Build 2500 Necropolises in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 3000 Necropolises | Build 3000 Necropolises in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 3500 Necropolises | Build 3500 Necropolises in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 5000 Necropolises | Build 5000 Necropolises in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 7500 Necropolises | Build 7500 Necropolises in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 12000 Necropolises | Build 12000 Necropolises in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 20000 Necropolises | Build 20000 Necropolises in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Royal Castle | Build 1 Royal Castle in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 50 Royal Castles | Build 50 Royal Castles in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 100 Royal Castles | Build 100 Royal Castles in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 150 Royal Castles | Build 150 Royal Castles in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 200 Royal Castles | Build 200 Royal Castles in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 300 Royal Castles | Build 300 Royal Castles in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 400 Royal Castles | Build 400 Royal Castles in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 500 Royal Castles | Build 500 Royal Castles in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 600 Royal Castles | Build 600 Royal Castles in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 700 Royal Castles | Build 700 Royal Castles in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 800 Royal Castles | Build 800 Royal Castles in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 900 Royal Castles | Build 900 Royal Castles in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1000 Royal Castles | Build 1000 Royal Castles in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1500 Royal Castles | Build 1500 Royal Castles in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 2000 Royal Castles | Build 2000 Royal Castles in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 2500 Royal Castles | Build 2500 Royal Castles in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 3000 Royal Castles | Build 3000 Royal Castles in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 3500 Royal Castles | Build 3500 Royal Castles in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 5000 Royal Castles | Build 5000 Royal Castles in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 7500 Royal Castles | Build 7500 Royal Castles in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 12000 Royal Castles | Build 12000 Royal Castles in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 20000 Royal Castles | Build 20000 Royal Castles in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Evil Fortress | Build 1 Evil Fortress in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 50 Evil Fortresses | Build 50 Evil Fortresses in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 100 Evil Fortresses | Build 100 Evil Fortresses in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 150 Evil Fortresses | Build 150 Evil Fortresses in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 200 Evil Fortresses | Build 200 Evil Fortresses in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 300 Evil Fortresses | Build 300 Evil Fortresses in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 400 Evil Fortresses | Build 400 Evil Fortresses in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 500 Evil Fortresses | Build 500 Evil Fortresses in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 600 Evil Fortresses | Build 600 Evil Fortresses in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 700 Evil Fortresses | Build 700 Evil Fortresses in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 800 Evil Fortresses | Build 800 Evil Fortresses in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 900 Evil Fortresses | Build 900 Evil Fortresses in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1000 Evil Fortresses | Build 1000 Evil Fortresses in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1500 Evil Fortresses | Build 1500 Evil Fortresses in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 2000 Evil Fortresses | Build 2000 Evil Fortresses in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 2500 Evil Fortresses | Build 2500 Evil Fortresses in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 3000 Evil Fortresses | Build 3000 Evil Fortresses in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 3500 Evil Fortresses | Build 3500 Evil Fortresses in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 5000 Evil Fortresses | Build 5000 Evil Fortresses in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 7500 Evil Fortresses | Build 7500 Evil Fortresses in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 12000 Evil Fortresses | Build 12000 Evil Fortresses in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 20000 Evil Fortresses | Build 20000 Evil Fortresses in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Heaven's Gate | Build 1 Heaven's Gate in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 50 Heaven's Gates | Build 50 Heaven's Gates in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 100 Heaven's Gates | Build 100 Heaven's Gates in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 150 Heaven's Gates | Build 150 Heaven's Gates in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 200 Heaven's Gates | Build 200 Heaven's Gates in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 300 Heaven's Gates | Build 300 Heaven's Gates in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 400 Heaven's Gates | Build 400 Heaven's Gates in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 500 Heaven's Gates | Build 500 Heaven's Gates in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 600 Heaven's Gates | Build 600 Heaven's Gates in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 700 Heaven's Gates | Build 700 Heaven's Gates in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 800 Heaven's Gates | Build 800 Heaven's Gates in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 900 Heaven's Gates | Build 900 Heaven's Gates in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1000 Heaven's Gates | Build 1000 Heaven's Gates in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1500 Heaven's Gates | Build 1500 Heaven's Gates in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 2000 Heaven's Gates | Build 2000 Heaven's Gates in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 2500 Heaven's Gates | Build 2500 Heaven's Gates in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 3000 Heaven's Gates | Build 3000 Heaven's Gates in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 3500 Heaven's Gates | Build 3500 Heaven's Gates in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 5000 Heaven's Gates | Build 5000 Heaven's Gates in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 7500 Heaven's Gates | Build 7500 Heaven's Gates in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 12000 Heaven's Gates | Build 12000 Heaven's Gates in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 20000 Heaven's Gates | Build 20000 Heaven's Gates in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Hell Portal | Build 1 Hell Portal in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 50 Hell Portals | Build 50 Hell Portals in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 100 Hell Portals | Build 100 Hell Portals in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 150 Hell Portals | Build 150 Hell Portals in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 200 Hell Portals | Build 200 Hell Portals in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 300 Hell Portals | Build 300 Hell Portals in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 400 Hell Portals | Build 400 Hell Portals in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 500 Hell Portals | Build 500 Hell Portals in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 600 Hell Portals | Build 600 Hell Portals in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 700 Hell Portals | Build 700 Hell Portals in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 800 Hell Portals | Build 800 Hell Portals in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 900 Hell Portals | Build 900 Hell Portals in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1000 Hell Portals | Build 1000 Hell Portals in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1500 Hell Portals | Build 1500 Hell Portals in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 2000 Hell Portals | Build 2000 Hell Portals in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 2500 Hell Portals | Build 2500 Hell Portals in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 3000 Hell Portals | Build 3000 Hell Portals in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 3500 Hell Portals | Build 3500 Hell Portals in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 5000 Hell Portals | Build 5000 Hell Portals in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 7500 Hell Portals | Build 7500 Hell Portals in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 12000 Hell Portals | Build 12000 Hell Portals in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 20000 Hell Portals | Build 20000 Hell Portals in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Deep Mine | Build 1 Deep Mine in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 50 Deep Mines | Build 50 Deep Mines in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 100 Deep Mines | Build 100 Deep Mines in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 150 Deep Mines | Build 150 Deep Mines in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 200 Deep Mines | Build 200 Deep Mines in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 300 Deep Mines | Build 300 Deep Mines in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 400 Deep Mines | Build 400 Deep Mines in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 500 Deep Mines | Build 500 Deep Mines in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 600 Deep Mines | Build 600 Deep Mines in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 700 Deep Mines | Build 700 Deep Mines in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 800 Deep Mines | Build 800 Deep Mines in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 900 Deep Mines | Build 900 Deep Mines in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1000 Deep Mines | Build 1000 Deep Mines in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1500 Deep Mines | Build 1500 Deep Mines in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 2000 Deep Mines | Build 2000 Deep Mines in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 2500 Deep Mines | Build 2500 Deep Mines in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 3000 Deep Mines | Build 3000 Deep Mines in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 3500 Deep Mines | Build 3500 Deep Mines in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 5000 Deep Mines | Build 5000 Deep Mines in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 7500 Deep Mines | Build 7500 Deep Mines in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 12000 Deep Mines | Build 12000 Deep Mines in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 20000 Deep Mines | Build 20000 Deep Mines in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Stone Pillar | Build 1 Stone Pillar in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 50 Stone Pillars | Build 50 Stone Pillars in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 100 Stone Pillars | Build 100 Stone Pillars in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 150 Stone Pillars | Build 150 Stone Pillars in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 200 Stone Pillars | Build 200 Stone Pillars in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 300 Stone Pillars | Build 300 Stone Pillars in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 400 Stone Pillars | Build 400 Stone Pillars in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 500 Stone Pillars | Build 500 Stone Pillars in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 600 Stone Pillars | Build 600 Stone Pillars in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 700 Stone Pillars | Build 700 Stone Pillars in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 800 Stone Pillars | Build 800 Stone Pillars in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 900 Stone Pillars | Build 900 Stone Pillars in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1000 Stone Pillars | Build 1000 Stone Pillars in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1500 Stone Pillars | Build 1500 Stone Pillars in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 2000 Stone Pillars | Build 2000 Stone Pillars in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 2500 Stone Pillars | Build 2500 Stone Pillars in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 3000 Stone Pillars | Build 3000 Stone Pillars in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 3500 Stone Pillars | Build 3500 Stone Pillars in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 5000 Stone Pillars | Build 5000 Stone Pillars in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 7500 Stone Pillars | Build 7500 Stone Pillars in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 12000 Stone Pillars | Build 12000 Stone Pillars in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 20000 Stone Pillars | Build 20000 Stone Pillars in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Alchemist Lab | Build 1 Alchemist Lab in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 50 Alchemist Labs | Build 50 Alchemist Labs in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 100 Alchemist Labs | Build 100 Alchemist Labs in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 150 Alchemist Labs | Build 150 Alchemist Labs in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 200 Alchemist Labs | Build 200 Alchemist Labs in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 300 Alchemist Labs | Build 300 Alchemist Labs in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 400 Alchemist Labs | Build 400 Alchemist Labs in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 500 Alchemist Labs | Build 500 Alchemist Labs in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 600 Alchemist Labs | Build 600 Alchemist Labs in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 700 Alchemist Labs | Build 700 Alchemist Labs in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 800 Alchemist Labs | Build 800 Alchemist Labs in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 900 Alchemist Labs | Build 900 Alchemist Labs in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1000 Alchemist Labs | Build 1000 Alchemist Labs in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1500 Alchemist Labs | Build 1500 Alchemist Labs in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 2000 Alchemist Labs | Build 2000 Alchemist Labs in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 2500 Alchemist Labs | Build 2500 Alchemist Labs in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 3000 Alchemist Labs | Build 3000 Alchemist Labs in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 3500 Alchemist Labs | Build 3500 Alchemist Labs in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 5000 Alchemist Labs | Build 5000 Alchemist Labs in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 7500 Alchemist Labs | Build 7500 Alchemist Labs in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 12000 Alchemist Labs | Build 12000 Alchemist Labs in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 20000 Alchemist Labs | Build 20000 Alchemist Labs in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Monastery | Build 1 Monastery in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 50 Monasteries | Build 50 Monasteries in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 100 Monasteries | Build 100 Monasteries in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 150 Monasteries | Build 150 Monasteries in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 200 Monasteries | Build 200 Monasteries in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 300 Monasteries | Build 300 Monasteries in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 400 Monasteries | Build 400 Monasteries in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 500 Monasteries | Build 500 Monasteries in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 600 Monasteries | Build 600 Monasteries in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 700 Monasteries | Build 700 Monasteries in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 800 Monasteries | Build 800 Monasteries in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 900 Monasteries | Build 900 Monasteries in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1000 Monasteries | Build 1000 Monasteries in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1500 Monasteries | Build 1500 Monasteries in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 2000 Monasteries | Build 2000 Monasteries in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 2500 Monasteries | Build 2500 Monasteries in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 3000 Monasteries | Build 3000 Monasteries in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 3500 Monasteries | Build 3500 Monasteries in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 5000 Monasteries | Build 5000 Monasteries in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 7500 Monasteries | Build 7500 Monasteries in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 12000 Monasteries | Build 12000 Monasteries in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 20000 Monasteries | Build 20000 Monasteries in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Labyrinth | Build 1 Labyrinth in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 50 Labyrinths | Build 50 Labyrinths in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 100 Labyrinths | Build 100 Labyrinths in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 150 Labyrinths | Build 150 Labyrinths in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 200 Labyrinths | Build 200 Labyrinths in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 300 Labyrinths | Build 300 Labyrinths in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 400 Labyrinths | Build 400 Labyrinths in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 500 Labyrinths | Build 500 Labyrinths in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 600 Labyrinths | Build 600 Labyrinths in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 700 Labyrinths | Build 700 Labyrinths in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 800 Labyrinths | Build 800 Labyrinths in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 900 Labyrinths | Build 900 Labyrinths in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1000 Labyrinths | Build 1000 Labyrinths in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1500 Labyrinths | Build 1500 Labyrinths in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 2000 Labyrinths | Build 2000 Labyrinths in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 2500 Labyrinths | Build 2500 Labyrinths in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 3000 Labyrinths | Build 3000 Labyrinths in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 3500 Labyrinths | Build 3500 Labyrinths in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 5000 Labyrinths | Build 5000 Labyrinths in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 7500 Labyrinths | Build 7500 Labyrinths in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 12000 Labyrinths | Build 12000 Labyrinths in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 20000 Labyrinths | Build 20000 Labyrinths in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Iron Stronghold | Build 1 Iron Stronghold in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 50 Iron Strongholds | Build 50 Iron Strongholds in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 100 Iron Strongholds | Build 100 Iron Strongholds in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 150 Iron Strongholds | Build 150 Iron Strongholds in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 200 Iron Strongholds | Build 200 Iron Strongholds in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 300 Iron Strongholds | Build 300 Iron Strongholds in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 400 Iron Strongholds | Build 400 Iron Strongholds in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 500 Iron Strongholds | Build 500 Iron Strongholds in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 600 Iron Strongholds | Build 600 Iron Strongholds in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 700 Iron Strongholds | Build 700 Iron Strongholds in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 800 Iron Strongholds | Build 800 Iron Strongholds in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 900 Iron Strongholds | Build 900 Iron Strongholds in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1000 Iron Strongholds | Build 1000 Iron Strongholds in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1500 Iron Strongholds | Build 1500 Iron Strongholds in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 2000 Iron Strongholds | Build 2000 Iron Strongholds in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 2500 Iron Strongholds | Build 2500 Iron Strongholds in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 3000 Iron Strongholds | Build 3000 Iron Strongholds in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 3500 Iron Strongholds | Build 3500 Iron Strongholds in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 5000 Iron Strongholds | Build 5000 Iron Strongholds in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 7500 Iron Strongholds | Build 7500 Iron Strongholds in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 12000 Iron Strongholds | Build 12000 Iron Strongholds in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 20000 Iron Strongholds | Build 20000 Iron Strongholds in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Ancient Pyramid | Build 1 Ancient Pyramid in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 50 Ancient Pyramids | Build 50 Ancient Pyramids in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 100 Ancient Pyramids | Build 100 Ancient Pyramids in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 150 Ancient Pyramids | Build 150 Ancient Pyramids in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 200 Ancient Pyramids | Build 200 Ancient Pyramids in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 300 Ancient Pyramids | Build 300 Ancient Pyramids in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 400 Ancient Pyramids | Build 400 Ancient Pyramids in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 500 Ancient Pyramids | Build 500 Ancient Pyramids in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 600 Ancient Pyramids | Build 600 Ancient Pyramids in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 700 Ancient Pyramids | Build 700 Ancient Pyramids in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 800 Ancient Pyramids | Build 800 Ancient Pyramids in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 900 Ancient Pyramids | Build 900 Ancient Pyramids in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1000 Ancient Pyramids | Build 1000 Ancient Pyramids in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1500 Ancient Pyramids | Build 1500 Ancient Pyramids in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 2000 Ancient Pyramids | Build 2000 Ancient Pyramids in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 2500 Ancient Pyramids | Build 2500 Ancient Pyramids in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 3000 Ancient Pyramids | Build 3000 Ancient Pyramids in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 3500 Ancient Pyramids | Build 3500 Ancient Pyramids in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 5000 Ancient Pyramids | Build 5000 Ancient Pyramids in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 7500 Ancient Pyramids | Build 7500 Ancient Pyramids in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 12000 Ancient Pyramid | Build 12000 Ancient Pyramids in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 20000 Ancient Pyramid | Build 20000 Ancient Pyramids in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1 Hall Of Legends | Build 1 Hall Of Legends in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 50 Halls Of Legends | Build 50 Halls Of Legends in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 100 Halls Of Legends | Build 100 Halls Of Legends in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 150 Halls Of Legends | Build 150 Halls Of Legends in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 200 Halls Of Legends | Build 200 Halls Of Legends in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 300 Halls Of Legends | Build 300 Halls Of Legends in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 400 Halls Of Legends | Build 400 Halls Of Legends in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 500 Halls Of Legends | Build 500 Halls Of Legends in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 600 Halls Of Legends | Build 600 Halls Of Legends in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 700 Halls Of Legends | Build 700 Halls Of Legends in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 800 Halls Of Legends | Build 800 Halls Of Legends in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 900 Halls Of Legends | Build 900 Halls Of Legends in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1000 Halls Of Legends | Build 1000 Halls Of Legends in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 1500 Halls Of Legends | Build 1500 Halls Of Legends in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 2000 Halls Of Legends | Build 2000 Halls Of Legends in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 2500 Halls Of Legends | Build 2500 Halls Of Legends in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 3000 Halls Of Legends | Build 3000 Halls Of Legends in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 3500 Halls Of Legends | Build 3500 Halls Of Legends in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 5000 Halls Of Legends | Build 5000 Halls Of Legends in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 7500 Halls Of Legends | Build 7500 Halls Of Legends in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 12000 Halls Of Legends | Build 12000 Halls Of Legends in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| 20000 Halls Of Legends | Build 20000 Halls Of Legends in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Village Grinder | Build a total of 100 buildings in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Town Grinder | Build a total of 250 buildings in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| City Grinder | Build a total of 500 buildings in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Kingdom Grinder | Build a total of 1,000 buildings in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Empire Grinder | Build a total of 2,000 buildings in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Realm Grinder | Build a total of 3,000 buildings in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| History Grinder | Build a total of 5,000 buildings in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| World Grinder | Build a total of 8,000 buildings in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Universe Grinder | Build a total of 12,000 buildings in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Multiverse Grinder | Build a total of 20,000 buildings in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Metagrinder | Build a total of 35,000 buildings in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Overgrinder | Build a total of 50,000 buildings in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| True Grinder | Build a total of 125,000 buildings in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Master Grinder | Build 200,000 buildings in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| Grandmaster Grinder | Build 300,000 buildings in a single game. | 未标注 | 未标注 | 未标注 | 未实现 |
| The Architect | Build 125,000 units of any individual building. | 未标注 | 未标注 | 未标注 | 未实现 |


## 5. 后续实现要求

- 每条奖杯保留稳定 ID、条件、成本、效果和升阶规则；
- 条件达成与购买／领取状态分开保存；
- Buff 通过统一效果注册表计算，不能重复叠加；
- 升阶修正必须由真实 A 状态驱动；
- 当前“部分接入”条目需要逐项补齐成本、时间窗、连续条件和重置规则；
- 新增奖杯必须配套条件、成本、Buff、迁移和浏览器测试。

## 6. 原版资料入口

- [Trophy Page](http://musicfamily.org/realm/TrophyPage)
- [Trophy Guide](http://musicfamily.org/realm/TrophyGuide)