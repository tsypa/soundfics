install:
	@./install.sh

deinstall:
	@./deinstall.sh

clean:
	find . -name "*~" -exec rm {} \;
