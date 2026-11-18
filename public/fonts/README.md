# public/fonts

`og-noto-sans-kr-bold.ttf` — `src/app/posts/[slug]/opengraph-image.tsx`가 쓰는 한글 폰트.

`next/og`(satori)는 ttf/otf/woff만 읽고 woff2는 읽지 못한다. 브라우저용으로 배포되는
Noto Sans KR 파일은 대부분 woff2라서, 아래처럼 TTF로 만들어 이 폴더에 둔다.

- 원본: [google/fonts — Noto Sans KR](https://github.com/google/fonts/tree/main/ofl/notosanskr) (가변 폰트 `NotoSansKR[wght].ttf`)
- 굵기: `wght=700`으로 고정
- 서브셋: `U+0020-007E`, `U+00A0-00FF`, `U+2000-206F`, `U+20A0-20CF`, `U+3131-318E`, `U+AC00-D7A3`, `U+FF00-FFEF`
  (한글 음절 11,172자 전체 + 라틴/기호). 글리프 11,663자, 약 2.4MB
- 레이아웃 테이블(GSUB/GPOS)은 OG 이미지에 필요 없어 제외

다시 만들어야 할 때는 이 폴더(`public/fonts`)에서 실행한다. 저장소 루트에서 돌리면 결과물이 루트에 떨어지고 라우트는 예전 파일을 계속 읽는다.

```sh
curl -L -o NotoSansKR-VF.ttf "https://github.com/google/fonts/raw/main/ofl/notosanskr/NotoSansKR%5Bwght%5D.ttf"

python3 - <<'PY'
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

font = TTFont("NotoSansKR-VF.ttf")
instantiateVariableFont(font, {"wght": 700}, inplace=True, updateFontNames=True)
font.save("NotoSansKR-Bold.ttf")
PY

pyftsubset NotoSansKR-Bold.ttf \
  --unicodes="U+0020-007E,U+00A0-00FF,U+2000-206F,U+20A0-20CF,U+3131-318E,U+AC00-D7A3,U+FF00-FFEF" \
  --layout-features="" --drop-tables+=GSUB,GPOS,GDEF,BASE,DSIG,meta --name-IDs=1,2,3,4,6 \
  --no-hinting --output-file=og-noto-sans-kr-bold.ttf
```

폰트 라이선스는 같은 폴더의 `OFL.txt`(SIL Open Font License 1.1)를 따른다.
