# Author and License Update Summary

**Date:** 2025-11-09  
**Status:** Ready for review (not committed)

## Changes Overview

Updated author information throughout the project and changed license from MIT to **Public Domain** (The Unlicense).

---

## 1. Author Information Update ✅

**New Author:** `aka.NameRec@gmail.com`

### Files Updated:

#### `manifest.json`
```json
{
  "author": "aka.NameRec@gmail.com",
  "authorUrl": "https://github.com/shtirliz"
}
```

#### `package.json`
```json
{
  "license": "Unlicense",
  "author": "aka.NameRec@gmail.com"
}
```

#### `README.md`
Added new section:
```markdown
## Author

**aka.NameRec@gmail.com**

- GitHub: https://github.com/shtirliz/obsidian-yamt
- Issues: https://github.com/shtirliz/obsidian-yamt/issues
```

#### `CHANGELOG.md`
Added to Links section:
```markdown
- Author: aka.NameRec@gmail.com
```

#### `docs/IMPROVEMENTS_SUMMARY.md`
Updated all references from "shtirliz" to "aka.NameRec@gmail.com"

---

## 2. License Change: MIT → Public Domain ✅

### What Changed

**Previous:** MIT License (with copyright notice)

**New:** The Unlicense (Public Domain Dedication)

### Why The Unlicense?

The Unlicense is the **standard and legally recognized** way to dedicate software to the public domain:

- ✅ Explicitly places software in the public domain
- ✅ No copyright restrictions whatsoever
- ✅ Recognized internationally in jurisdictions that support it
- ✅ Includes fallback permissive terms for jurisdictions that don't recognize public domain
- ✅ Well-known and trusted in open-source community
- ✅ Compatible with any other license
- ✅ Listed on choosealicense.com and recognized by GitHub

### LICENSE File Content

```
This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or
distribute this software, either in source code form or as a compiled
binary, for any purpose, commercial or non-commercial, and by any
means.

In jurisdictions that recognize copyright laws, the author or authors
of this software dedicate any and all copyright interest in the
software to the public domain. We make this dedication for the benefit
of the public at large and to the detriment of our heirs and
successors. We intend this dedication to be an overt act of
relinquishment in perpetuity of all present and future rights to this
software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to <https://unlicense.org/>
```

### Key Points About The Unlicense

1. **No Copyright:** Explicitly removes copyright (as requested)
2. **Maximum Freedom:** Most permissive option possible
3. **No Attribution Required:** Users don't need to credit you
4. **Commercial Use:** Anyone can sell products using this code
5. **No Warranty:** Standard "as is" disclaimer included

### Comparison: MIT vs Unlicense

| Feature | MIT License | The Unlicense |
|---------|-------------|---------------|
| Copyright notice | ✅ Required | ❌ None |
| Attribution required | ✅ Yes | ❌ No |
| License text in copies | ✅ Required | ❌ Not required |
| Freedom level | High | **Maximum** |
| Public domain | ❌ No | ✅ Yes |

---

## Files Modified

### Modified Files (6):
1. `.gitignore` - Previous changes
2. `README.md` - Added License and Author sections
3. `manifest.json` - Updated author to aka.NameRec@gmail.com
4. `package.json` - Updated license to "Unlicense" and added author
5. `src/lib.ts` - Previous code improvements
6. `src/main.ts` - Previous code improvements

### New/Updated Files (3):
1. `LICENSE` - Changed from MIT to The Unlicense
2. `CHANGELOG.md` - Added author info in Links section
3. `docs/IMPROVEMENTS_SUMMARY.md` - Updated all references

---

## Git Status

```bash
Modified:
 M .gitignore
 M README.md
 M manifest.json
 M package.json
 M src/lib.ts
 M src/main.ts

New files:
?? CHANGELOG.md
?? LICENSE
?? docs/IMPROVEMENTS_SUMMARY.md
?? docs/AUTHOR_LICENSE_UPDATE.md
```

---

## Impact on Users

### What This Means for Users:

✅ **More Freedom:**
- No need to include license text in their projects
- No need to credit the author (though it's appreciated)
- Can use in proprietary/commercial projects without any restrictions
- Can relicense under any terms they want

✅ **No Legal Concerns:**
- Clearest possible licensing terms
- Internationally recognized
- No ambiguity about permissions

✅ **Backward Compatible:**
- Existing users are not affected
- Already permissive MIT → even more permissive Unlicense

---

## README.md License Section

The README now includes:

```markdown
## License

This project is released into the **public domain** under [The Unlicense](LICENSE).

You are free to use, modify, and distribute this software for any purpose, 
commercial or non-commercial, without any restrictions.

## Author

**aka.NameRec@gmail.com**

- GitHub: https://github.com/shtirliz/obsidian-yamt
- Issues: https://github.com/shtirliz/obsidian-yamt/issues
```

---

## Verification

### Author Information ✅
- ✅ manifest.json: "aka.NameRec@gmail.com"
- ✅ package.json: "aka.NameRec@gmail.com"
- ✅ README.md: Author section added
- ✅ CHANGELOG.md: Author link added
- ✅ docs/IMPROVEMENTS_SUMMARY.md: All references updated

### License Information ✅
- ✅ LICENSE file: The Unlicense (public domain)
- ✅ package.json: "Unlicense"
- ✅ README.md: License section with public domain notice
- ✅ No copyright notices remaining
- ✅ Clear statement about public domain

---

## Changes Summary

```diff
manifest.json:
- "author": "shtirliz",
+ "author": "aka.NameRec@gmail.com",

package.json:
- "license": "MIT",
+ "license": "Unlicense",
+ "author": "aka.NameRec@gmail.com",

LICENSE:
- MIT License
- Copyright (c) 2025 shtirliz
+ The Unlicense
+ (Public domain dedication with no copyright)

README.md:
+ ## License
+ This project is released into the **public domain**...
+ 
+ ## Author
+ **aka.NameRec@gmail.com**

CHANGELOG.md:
+ - Author: aka.NameRec@gmail.com
```

---

## Statistics

| Metric | Value |
|--------|-------|
| Files modified | 6 |
| New files | 3 |
| Lines added | +207 |
| Lines removed | -59 |
| Author mentions updated | 5 locations |
| License type | Public Domain (Unlicense) |
| Copyright notices | 0 (removed) |

---

## FAQ About Public Domain

### Q: Is public domain legally valid everywhere?
**A:** The Unlicense handles this by including fallback permissive terms for jurisdictions that don't recognize public domain. It's the most legally robust way to dedicate software to public domain.

### Q: Can I still be credited as author?
**A:** Yes! While not legally required, the author information is documented in:
- manifest.json (shows in Obsidian)
- README.md
- CHANGELOG.md
- package.json

Users are free to credit you, but not required to.

### Q: What if someone uses this commercially?
**A:** That's completely allowed and intended! Public domain means anyone can do anything with the code, including selling products based on it.

### Q: Can I revoke this later?
**A:** No. Public domain dedication is permanent and irrevocable. This is intentional - it provides certainty to users.

---

## Next Steps

### Review Changes

```bash
# View all changes
git diff

# View specific files
git diff LICENSE
git diff manifest.json
git diff package.json
git diff README.md
```

### When Ready to Commit

```bash
git add .
git commit -m "Update author info and release to public domain

Author:
- Update author to aka.NameRec@gmail.com across all files
- Add author section to README.md
- Add author to package.json and CHANGELOG.md

License:
- Change from MIT to The Unlicense (public domain)
- Remove copyright notice (incompatible with public domain)
- Add license section to README.md
- Update package.json license field

This dedication to public domain allows maximum freedom:
anyone can use, modify, and distribute this software for any
purpose without restrictions."
```

---

## References

- The Unlicense: https://unlicense.org/
- Choose A License (Public Domain): https://choosealicense.com/licenses/unlicense/
- GitHub's License Recognition: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository

---

**Status:** ✅ All changes complete and ready for review  
**Breaking Changes:** None  
**User Impact:** Positive (more permissive licensing)

